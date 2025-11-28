declare module 'docxtemplater-image-module-free' {
  interface ImageModuleOptions {
    fileType?: 'docx' | 'pptx';
    centered?: boolean;
    getImage: (tagValue: string, tagName?: string) => Promise<ArrayBuffer | null> | ArrayBuffer | null;
    getSize: (buffer: unknown, tagValue: string, tagName: string) => [number, number];
  }

  class ImageModule {
    constructor(options: ImageModuleOptions);
  }

  export default ImageModule;
}

declare module 'angular-expressions' {
  interface Expression {
    (scope: any, context?: any): any;
  }

  function compile(expression: string): Expression;
  
  export { compile };
  export default { compile };
}
