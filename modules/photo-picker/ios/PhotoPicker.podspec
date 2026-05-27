Pod::Spec.new do |s|
  s.name = "PhotoPicker"
  s.version = "1.0.0"
  s.summary = "Simple UIImagePickerController wrapper for Expo"
  s.homepage = "https://github.com/AuntYang/LoanHelper"
  s.license = "MIT"
  s.author = "AuntYang"
  s.source = { :git => "" }
  s.source_files = "**/*.{h,m,mm,swift}"
  s.dependency "ExpoModulesCore"
  s.swift_version = "5.4"
end
