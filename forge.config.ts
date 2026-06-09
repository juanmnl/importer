import path from 'path';
import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerZIP } from '@electron-forge/maker-zip';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

// Only sign + notarize when a signing identity is provided (i.e. in CI).
// Local `npm run make` builds stay unsigned.
const osxSign = process.env.APPLE_SIGNING_IDENTITY
  ? {
      osxSign: {
        identity: process.env.APPLE_SIGNING_IDENTITY,
        optionsForFile: () => ({
          entitlements: path.resolve(__dirname, 'assets/entitlements.plist'),
        }),
      },
      osxNotarize: {
        appleApiKey: process.env.APPLE_API_KEY as string,
        appleApiKeyId: process.env.APPLE_API_KEY_ID as string,
        appleApiIssuer: process.env.APPLE_API_ISSUER as string,
      },
    }
  : {};

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    name: 'Photo Importer',
    icon: path.resolve(__dirname, 'assets/brand/icon'),
    ...osxSign,
  },
  rebuildConfig: {},
  makers: [
    new MakerDMG({
      format: 'ULFO',
      icon: path.resolve(__dirname, 'assets/brand/icon.icns'),
      contents: (opts) => [
        { x: 192, y: 160, type: 'file', path: opts.appPath },
        { x: 448, y: 160, type: 'link', path: '/Applications' },
      ],
      background: path.resolve(__dirname, 'assets/brand/dmg-bg.png'),
      additionalDMGOptions: {
        window: { size: { width: 640, height: 380 } },
        'icon-size': 80,
      },
    }),
    new MakerZIP({}, ['darwin']),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/main/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
