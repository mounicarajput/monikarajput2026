import Vision
import AppKit

func ocr(path: String) {
    let url = URL(fileURLWithPath: path)
    guard let img = NSImage(contentsOf: url),
          let cgImg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { return }
    let request = VNRecognizeTextRequest()
    let handler = VNImageRequestHandler(cgImage: cgImg, options: [:])
    try? handler.perform([request])
    let results = request.results ?? []
    let strings = results.compactMap { $0.topCandidates(1).first?.string }
    print(path)
    print(strings.joined(separator: " | "))
    print("---")
}

ocr(path: "/Users/monikarajput/.gemini/antigravity-ide/brain/8e7b3ebd-c3e4-4492-abf5-7ca9ea2d4c9b/media__1784809746965.png")
ocr(path: "/Users/monikarajput/.gemini/antigravity-ide/brain/8e7b3ebd-c3e4-4492-abf5-7ca9ea2d4c9b/media__1784809746968.png")
