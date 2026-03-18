{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs
    python3
    python3Packages.pip
    python3Packages.numpy
    python3Packages.scipy
    chromium
    stdenv.cc.cc.lib
  ];

  shellHook = ''
    export PLAYWRIGHT_BROWSERS_PATH=0
    export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=${pkgs.chromium}/bin/chromium
    export LD_LIBRARY_PATH="${pkgs.stdenv.cc.cc.lib}/lib:/run/opengl-driver/lib:$LD_LIBRARY_PATH"
  '';
}
