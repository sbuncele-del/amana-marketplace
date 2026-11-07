import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

func fail(_ message: String) -> Never {
    FileHandle.standardError.write(Data(("Icon generation failed: " + message + "\n").utf8))
    exit(1)
}

guard CommandLine.arguments.count == 3 else {
    fail("Expected a source image and output PNG path.")
}
let sourceURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])
guard let source = CGImageSourceCreateWithURL(sourceURL as CFURL, nil),
      let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
    fail("Could not decode the source image.")
}
let size = 1024
guard let context = CGContext(
    data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: 0,
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
) else {
    fail("Could not allocate the image buffer.")
}
let bounds = CGRect(x: 0, y: 0, width: size, height: size)
context.setFillColor(red: 1, green: 1, blue: 1, alpha: 1)
context.fill(bounds)
context.interpolationQuality = .high
context.draw(image, in: bounds)
guard let result = context.makeImage(),
      let destination = CGImageDestinationCreateWithURL(
        outputURL as CFURL, UTType.png.identifier as CFString, 1, nil
      ) else {
    fail("Could not create the output PNG.")
}
CGImageDestinationAddImage(destination, result, nil)
guard CGImageDestinationFinalize(destination) else {
    fail("Could not write the output PNG.")
}
print("Generated opaque 1024 x 1024 app icon.")
