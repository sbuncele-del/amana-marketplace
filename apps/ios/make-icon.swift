import AppKit

let source = URL(fileURLWithPath: CommandLine.arguments[1])
let destination = URL(fileURLWithPath: CommandLine.arguments[2])
let image = NSImage(contentsOf: source)!
let bounds = NSRect(x: 0, y: 0, width: 1024, height: 1024)
let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 1024, pixelsHigh: 1024,
    bitsPerSample: 8, samplesPerPixel: 3, hasAlpha: false, isPlanar: false, colorSpaceName: .deviceRGB,
    bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
NSColor.white.setFill()
bounds.fill()
image.draw(in: bounds)
NSGraphicsContext.restoreGraphicsState()
try bitmap.representation(using: .png, properties: [:])!.write(to: destination)
