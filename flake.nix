{
  description = "Run 'nix develop' to have a dev shell that has everything this project needs";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_18
            nodePackages_latest.pnpm
            nodePackages_latest.vercel
            nodePackages_latest.prisma
            postgresql_15
            openssl
          ];
          shellHook = ''
            		ln -sf $(pwd)/node_modules/.pnpm/@prisma+client@5.0.0_prisma@5.0.0/node_modules/.prisma/client/libquery_engine.node node_modules/.pnpm/@prisma+client@5.0.0_prisma@5.0.0/node_modules/.prisma/client/libquery_engine-linux-nixos.so.node
          '';
        };
      });
}