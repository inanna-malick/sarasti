{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs
    python3
    python3Packages.pip
    python3Packages.numpy
    python3Packages.scipy
  ];
}
