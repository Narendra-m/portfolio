// scripts/cutout.swift
// Produces a transparent-background PNG cut-out of the subject using Apple's
// Vision person-segmentation model. Runs fully offline on the CPU/ANE, which
// avoids the MediaPipe WASM path that stalls in headless Chrome without a GPU.
//
// Usage:
//   swift scripts/cutout.swift --src=assets/img/avatar-source.jpg \
//        --out=assets/img/avatar-cutout.png \
//        --cx=160 --cy=401 --cw=2000 --ch=2500 --w=800 --h=1000
//
// Crop coordinates are in *display* pixels of the EXIF-oriented image, matching
// the --cx/--cy/--cw/--ch arguments used by generate-avatar.mjs.

import Foundation
import CoreImage
import Vision
import AppKit

func arg(_ name: String) -> String? {
    for a in CommandLine.arguments where a.hasPrefix("--\(name)=") {
        return String(a.dropFirst(name.count + 3))
    }
    return nil
}
func num(_ name: String, _ fallback: CGFloat) -> CGFloat {
    guard let s = arg(name), let d = Double(s) else { return fallback }
    return CGFloat(d)
}
func fail(_ msg: String) -> Never {
    FileHandle.standardError.write(("  x cutout: " + msg + "\n").data(using: .utf8)!)
    exit(1)
}

let srcPath = arg("src") ?? "assets/img/avatar-source.jpg"
let outPath = arg("out") ?? "assets/img/avatar-cutout.png"
let outW    = num("w", 800)
let outH    = num("h", 1000)

let srcURL = URL(fileURLWithPath: srcPath)
guard FileManager.default.fileExists(atPath: srcURL.path) else { fail("source not found: \(srcPath)") }

// Load with EXIF orientation baked in so crop coords match what you see.
guard let full = CIImage(contentsOf: srcURL, options: [.applyOrientationProperty: true]) else {
    fail("could not decode \(srcPath)")
}

let fullW = full.extent.width
let fullH = full.extent.height
let cx = num("cx", 0)
let cy = num("cy", 0)
let cw = num("cw", fullW)
let ch = num("ch", fullH)

// Convert top-left origin crop rect to Core Image's bottom-left origin.
let cropRect = CGRect(x: cx, y: fullH - (cy + ch), width: cw, height: ch)
    .intersection(full.extent)
guard !cropRect.isNull, cropRect.width > 1 else { fail("crop rect is outside the image") }

let cropped = full.cropped(to: cropRect)
    .transformed(by: CGAffineTransform(translationX: -cropRect.minX, y: -cropRect.minY))

// Scale the crop to the final output size.
let scaled = cropped.transformed(by: CGAffineTransform(
    scaleX: outW / cropRect.width,
    y:      outH / cropRect.height
)).cropped(to: CGRect(x: 0, y: 0, width: outW, height: outH))

let ctx = CIContext(options: [.useSoftwareRenderer: false])
guard let subjectCG = ctx.createCGImage(scaled, from: scaled.extent) else {
    fail("could not rasterise the cropped image")
}

// Vision person segmentation.
let request = VNGeneratePersonSegmentationRequest()
request.qualityLevel = .accurate
request.outputPixelFormat = kCVPixelFormatType_OneComponent8

do {
    try VNImageRequestHandler(cgImage: subjectCG, options: [:]).perform([request])
} catch {
    fail("Vision request failed: \(error.localizedDescription)")
}

guard let mask = request.results?.first?.pixelBuffer else {
    fail("no person detected — check the crop region")
}

// The mask comes back at the model's own resolution; stretch it to the output.
var maskImage = CIImage(cvPixelBuffer: mask)
maskImage = maskImage.transformed(by: CGAffineTransform(
    scaleX: outW / maskImage.extent.width,
    y:      outH / maskImage.extent.height
))

guard let blend = CIFilter(name: "CIBlendWithMask") else { fail("CIBlendWithMask unavailable") }
blend.setValue(scaled, forKey: kCIInputImageKey)
blend.setValue(CIImage.empty(), forKey: kCIInputBackgroundImageKey)   // transparent
blend.setValue(maskImage, forKey: kCIInputMaskImageKey)

guard let result = blend.outputImage?.cropped(
    to: CGRect(x: 0, y: 0, width: outW, height: outH)
) else { fail("compositing failed") }

let outURL = URL(fileURLWithPath: outPath)
try? FileManager.default.createDirectory(
    at: outURL.deletingLastPathComponent(), withIntermediateDirectories: true
)

do {
    try ctx.writePNGRepresentation(
        of: result, to: outURL,
        format: .RGBA8,
        colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!
    )
} catch {
    fail("could not write \(outPath): \(error.localizedDescription)")
}

print("  * cut-out written: \(outPath) (\(Int(outW))x\(Int(outH)))")
