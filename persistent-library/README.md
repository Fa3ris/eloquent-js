Dummy project to configure a library and its client

- /lib - typescript library
- /client - vanilla js client
- /client-ts - typescript client


- /lib
    - package.json
        - specify the entry-point, the type declarations, the files to include in package
        "main": "out/main.js",
        "types": "out/main.d.ts"
        "files": [ "out/" ]
    - tsconfig.json
        - specify to create declaration files and source map for declaration files
        "declaration": true,
        "declarationMap": true,

    - pack as tarball for local use

- /client, /client-ts
    - install as file dependency
        "dependencies": {
             "persistent": "file:../lib/persistent-1.0.0.tgz"
        }
    
    - use as regular CommonJS or ES module

