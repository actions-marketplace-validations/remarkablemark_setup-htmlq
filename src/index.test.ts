import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import os from 'os';

import { run } from '.';

jest.mock('@actions/core');
jest.mock('@actions/tool-cache');
jest.mock('os');

const mockedCore = jest.mocked(core);
const mockedTc = jest.mocked(tc);
const mockedOs = jest.mocked(os);

beforeEach(() => {
  jest.resetAllMocks();
});

describe.each(['darwin', 'win32', 'linux'])('when OS is %p', (os) => {
  beforeEach(() => {
    mockedOs.platform.mockReturnValueOnce(os as NodeJS.Platform);
    mockedOs.arch.mockReturnValueOnce('arm64');
  });

  it('downloads, extracts, and exposes CLI in PATH', async () => {
    const version = '0.4.0';
    const pathToTarball = 'path/to/tarball';
    const pathToCLI = 'path/to/cli';

    mockedCore.getInput.mockImplementationOnce((name) =>
      name === 'htmlq-version' ? version : ''
    );
    mockedTc.downloadTool.mockResolvedValueOnce(pathToTarball);
    const extract = os === 'win32' ? mockedTc.extractZip : mockedTc.extractTar;
    extract.mockResolvedValueOnce(pathToCLI);

    await run();

    expect(mockedTc.downloadTool).toBeCalledWith(
      expect.stringContaining(
        `https://github.com/mgdm/htmlq/releases/download/v${version}/htmlq-x86_64-`
      )
    );
    expect(extract).toBeCalledWith(pathToTarball);
    expect(mockedCore.addPath).toBeCalledWith(
      expect.stringContaining(pathToCLI)
    );
  });
});

it('catches error', async () => {
  const message = 'error';
  mockedCore.getInput.mockImplementationOnce(() => {
    throw new Error(message);
  });
  await run();
  expect(mockedCore.setFailed).toBeCalledWith(message);
});
