/* eslint-disable @typescript-eslint/no-unused-vars */

/*
Add this to tsconfig.app.json: "include": ["src/**\/*.d.ts"]
Add this to tsconfig.spec.json: "include": ["src/**\/*.spec.ts", "src/**\/*.d.ts"]
So the ng test will find the extension
*/

import './array-extensions';

declare global {
  interface Array<T> extends Array {
    myCustomMethod(): void;
  }
}
