require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "NativeDeviceInfo"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "11.0" }
  s.source       = { :git => "#{package["repository"]["url"]}.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.requires_arc = true

  s.dependency "React-Core"
  s.dependency "React-callinvoker"
  s.dependency "React-RCTImage"
  s.dependency "ReactCommon/turbomodule/core"

  s.swift_version = "5.0"

  # Enable modular headers for Swift compatibility
  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES",
    "SWIFT_OBJC_INTERFACE_HEADER_NAME" => "NativeDeviceInfo-Swift.h"
  }

  # Add required frameworks
  s.frameworks = [
    "Foundation",
    "UIKit",
    "CoreLocation",
    "LocalAuthentication",
    "AVFoundation",
    "SystemConfiguration"
  ]
end