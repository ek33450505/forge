# Update sha256 and url after first release build
cask "forge" do
  version "1.0.0"
  sha256 "PLACEHOLDER"

  url "https://github.com/ek33450505/forge/releases/download/v#{version}/Forge_#{version}_aarch64.dmg"
  name "Forge"
  desc "A developer terminal built around Claude Code"
  homepage "https://github.com/ek33450505/forge"

  app "Forge.app"

  zap trash: [
    "~/.config/forge",
  ]
end
