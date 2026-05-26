import ExpoModulesCore
import Vision

public class VisionTextRecognizerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("VisionTextRecognizer")

    AsyncFunction("recognize") { (imageUri: String) -> [String] in
      let imageUrl: URL
      if let url = URL(string: imageUri), url.scheme != nil {
        imageUrl = url
      } else {
        imageUrl = URL(fileURLWithPath: imageUri)
      }

      guard let imageData = try? Data(contentsOf: imageUrl),
            let image = UIImage(data: imageData),
            let cgImage = image.cgImage else {
        throw TextRecognizerError.invalidImage
      }

      // Perform recognition with two passes for best results
      let lines = try recognizeTextFull(cgImage: cgImage)
      return lines
    }
  }

  private func recognizeTextFull(cgImage: CGImage) throws -> [String] {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.recognitionLanguages = ["zh-Hans", "en-US"]
    request.usesLanguageCorrection = true
    request.minimumTextHeight = 0.01

    // Add custom words for better Chinese ID card recognition
    request.customWords = [
      "姓名", "性别", "民族", "出生", "住址",
      "身份证号码", "签发机关", "有效期限",
      "公民身份号码", "中华人民共和国",
      "居民身份证", "国籍"
    ]

    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    try handler.perform([request])

    guard let observations = request.results as? [VNRecognizedTextObservation] else {
      return []
    }

    // Sort by Y coordinate (top to bottom) then by X (left to right)
    let sorted = observations.sorted { a, b in
      let aY = a.boundingBox.origin.y + a.boundingBox.size.height / 2
      let bY = b.boundingBox.origin.y + b.boundingBox.size.height / 2
      if abs(aY - bY) < 0.02 {
        // Same line group - sort left to right
        return a.boundingBox.origin.x < b.boundingBox.origin.x
      }
      return aY > bY
    }

    return sorted.compactMap { observation in
      observation.topCandidates(1).first?.string
    }
  }
}

enum TextRecognizerError: Error {
  case invalidImage
}
