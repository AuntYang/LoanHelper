import ExpoModulesCore
import UIKit

public class PhotoPickerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PhotoPicker")

    Function("isAvailable") {
      return UIImagePickerController.isSourceTypeAvailable(.photoLibrary)
    }

    AsyncFunction("pickFromLibrary") { (promise: Promise) in
      DispatchQueue.main.async {
        let helper = PhotoPickerHelper(promise: promise)
        let picker = UIImagePickerController()
        picker.sourceType = .photoLibrary
        picker.mediaTypes = ["public.image"]
        picker.delegate = helper

        if let rootVC = PhotoPickerHelper.getRootViewController() {
          PhotoPickerHelper.currentHelper = helper
          rootVC.present(picker, animated: true)
        } else {
          promise.reject("NO_VIEW_CONTROLLER", "Could not find root view controller")
        }
      }
    }
  }
}

class PhotoPickerHelper: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
  let promise: Promise

  init(promise: Promise) {
    self.promise = promise
    super.init()
  }

  func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
    picker.dismiss(animated: true)
    PhotoPickerHelper.currentHelper = nil

    if let imageUrl = info[.imageURL] as? URL {
      promise.resolve(imageUrl.absoluteString)
    } else if let image = info[.originalImage] as? UIImage {
      let tempDir = FileManager.default.temporaryDirectory
      let fileName = "photo_\(Date().timeIntervalSince1970).jpg"
      let fileUrl = tempDir.appendingPathComponent(fileName)
      if let data = image.jpegData(compressionQuality: 0.8) {
        try? data.write(to: fileUrl)
        promise.resolve(fileUrl.absoluteString)
      } else {
        promise.reject("SAVE_ERROR", "Could not save image")
      }
    } else {
      promise.reject("NO_IMAGE", "No image selected")
    }
  }

  func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
    picker.dismiss(animated: true)
    PhotoPickerHelper.currentHelper = nil
    promise.reject("CANCELLED", "User cancelled")
  }

  static var currentHelper: PhotoPickerHelper?

  static func getRootViewController() -> UIViewController? {
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
