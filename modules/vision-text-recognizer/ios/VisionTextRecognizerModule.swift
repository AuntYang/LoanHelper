import ExpoModulesCore
import Vision

public class VisionTextRecognizerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("VisionTextRecognizer")

    AsyncFunction("recognize") { (imageUri: String) -> [String] in
      guard let imageUrl = URL(string: imageUri) ?? URL(fileURLWithPath: imageUri),
            let imageData = try? Data(contentsOf: imageUrl),
            let image = UIImage(data: imageData),
            let cgImage = image.cgImage else {
        throw TextRecognizerError.invalidImage
      }

      return try recognizeText(cgImage: cgImage)
    }
  }

  private func recognizeText(cgImage: CGImage) throws -> [String] {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.recognitionLanguages = ["zh-Hans", "en-US"]
    request.usesLanguageCorrection = true

    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    try handler.perform([request])

    guard let observations = request.results as? [VNRecognizedTextObservation] else {
      return []
    }

    return observations.compactMap { observation in
      observation.topCandidates(1).first?.string
    }
  }
}

enum TextRecognizerError: Error {
  case invalidImage
}
