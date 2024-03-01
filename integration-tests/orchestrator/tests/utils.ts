import { spawn } from 'child_process';
import { readFile, writeFile } from 'fs';

export const pause = (delay = 1000) =>
  new Promise((resolve) => setTimeout(resolve, delay));

export const copyFile = (fromPath: string, toPath: string) => {
  return new Promise((resolve, reject) => {
    readFile(fromPath, (err, data) => {
      if (err) {
        return reject(err);
      }

      writeFile(toPath, data, (err) => {
        if (err) {
          return reject(err);
        }

        resolve(void 0);
      });
    });
  });
};

export interface RunningProcess {
  kill: () => void;
  waitForTextInStdout: (text: string, timeout?: number) => Promise<void>;
}

export const run = (
  rootDir: string,
  relativePathToExecutable: string,
  args: string[],
): RunningProcess => {
  const handle = spawn(`${rootDir}/${relativePathToExecutable}`, args, {
    cwd: rootDir,
  });

  return {
    kill: () => handle.kill(),
    waitForTextInStdout: (text: string, timeout = 5000) => {
      return new Promise((resolve, reject) => {
        let stdoutBuffer = '';

        const cleanup = () => {
          handle.off('error', errorHandler);
          handle.off('exit', exitHandler);
          handle.stdout.off('error', errorHandler);
          handle.stdout.off('close', exitHandler);
          handle.stdout.off('data', dataHandler);
          clearTimeout(timeoutId);
        };

        const exitHandler = () => {
          cleanup();
          reject(new Error('exited prematurely'));
        };

        const errorHandler = (error: unknown) => {
          cleanup();
          reject(error);
        };

        const dataHandler = (chunk: Buffer | string) => {
          stdoutBuffer += chunk.toString();

          if (stdoutBuffer.includes(text)) {
            cleanup();
            resolve(void 0);
          }
        };

        handle.on('error', errorHandler);
        handle.on('exit', exitHandler);
        handle.stdout.on('error', errorHandler);
        handle.stdout.on('close', exitHandler);
        handle.stdout.on('data', dataHandler);

        const timeoutId = setTimeout(() => {
          cleanup();
          reject(
            new Error(
              `timed out: haven't seen "${text}" in stdout for ${timeout} ms`,
            ),
          );
        }, 5000);
      });
    },
  };
};
