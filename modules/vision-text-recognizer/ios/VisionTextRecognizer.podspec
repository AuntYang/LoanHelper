Pod::Spec.new do |s|
  s.name = "VisionTextRecognizer"
  s.version = "1.0.0"
  s.summary = "iOS Vision framework text recognizer for Expo"
  s.homepage = "https://github.com/AuntYang/LoanHelper"
  s.license = "MIT"
  s.author = "AuntYang"
  s.source = { :git => "" }
  s.source_files = "**/*.{h,m,mm,swift}"
  s.dependency "ExpoModulesCore"
  s.swift_version = "5.4"
end
