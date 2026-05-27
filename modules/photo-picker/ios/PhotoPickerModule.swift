import ExpoModulesCore
import UIKit

public class PhotoPickerModule: Module {
  private var promise: Promise?
  private var picker: UIImagePickerController?

  public func definition() -> ModuleDefinition {
    Name("PhotoPicker")

    Function("isAvailable") {
      return UIImagePickerController.isSourceTypeAvailable(.photoLibrary)
    }

    AsyncFunction("pickFromLibrary") { (promise: Promise) in
      self.promise = promise

      DispatchQueue.main.async {
        let picker = UIImagePickerController()
        picker.sourceType = .photoLibrary
        picker.mediaTypes = ["public.image"]
        picker.delegate = self

        // Get the topmost view controller to present from
        if let rootVC = self.getRootViewController() {
          self.picker = picker
          rootVC.present(picker, animated: true)
        } else {
          promise.reject("NO_VIEW_CONTROLLER", "Could not find root view controller")
        }
      }
    }
  }

  private func getRootViewController() -> UIViewController? {
    var window: UIWindow?
    if #available(iOS 15.0, *) {
      window = UIApplication.shared.connectedScenes
        .filter { $0.activationState == .foregroundActive }
        .compactMap { $0 as? UIWindowScene }
        .first?.windows
        .first { $0.isKeyWindow }
    } else {
      window = UIApplication.shared.keyWindow
    }
    if window == nil {
      window = UIApplication.shared.windows.first { $0.isKeyWindow }
    }
    return window?.rootViewController?.topMostViewController()
  }
}

extension PhotoPickerModule: UIImagePickerControllerDelegate, UINavigationControllerDelegate {
  public func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
    picker.dismiss(animated: true)

    if let imageUrl = info[.imageURL] as? URL {
      self.promise?.resolve(imageUrl.absoluteString)
    } else if let image = info[.originalImage] as? UIImage {
      // Save to temp directory and return path
      let tempDir = FileManager.default.temporaryDirectory
      let fileName = "photo_\(Date().timeIntervalSince1970).jpg"
      let fileUrl = tempDir.appendingPathComponent(fileName)
      if let data = image.jpegData(compressionQuality: 0.8) {
        try? data.write(to: fileUrl)
        self.promise?.resolve(fileUrl.absoluteString)
      } else {
        self.promise?.reject("SAVE_ERROR", "Could not save image")
      }
    } else {
      self.promise?.reject("NO_IMAGE", "No image selected")
    }
    self.picker = nil
    self.promise = nil
  }

  public func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
    picker.dismiss(animated: true)
    self.promise?.reject("CANCELLED", "User cancelled")
    self.picker = nil
    self.promise = nil
  }
}

extension UIViewController {
  func topMostViewController() -> UIViewController {
    if let presented = presentedViewController {
      return presented.topMostViewController()
    }
    if let nav = self as? UINavigationController {
      return nav.visibleViewController?.topMostViewController() ?? self
    }
    if let tab = self as? UITabBarController {
      return tab.selectedViewController?.topMostViewController() ?? self
    }
    return self
  }
}
