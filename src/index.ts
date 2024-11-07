import 'reflect-metadata';
import http from "http";

type AsyncFunc = (...args: any[]) => Promise<any>;

export enum METADATA_KEY {
  METHOD = 'ioc:method',
  PATH = 'ioc:path',
  MIDDLEWARE = 'ioc:middleware',
}

export enum REQUEST_METHOD {
  GET = 'ioc:get',
  POST = 'ioc:post',
}

export const methodDecoratorFactory = (method: string) => {
  return (path: string): MethodDecorator => {
    return (_target, _key, descriptor) => {
      // 在类方法实现上注册 ioc:method - 请求方法 的元数据
      Reflect.defineMetadata(METADATA_KEY.METHOD, method, descriptor.value!);
      // 在类方法实现上注册 ioc:path - 请求路径 的元数据
      Reflect.defineMetadata(METADATA_KEY.PATH, path, descriptor.value!);
    };
  };
};

export const Get = methodDecoratorFactory(REQUEST_METHOD.GET);
export const Post = methodDecoratorFactory(REQUEST_METHOD.POST);

export const Controller = (path?: string): ClassDecorator => {
  return (target) => {
    Reflect.defineMetadata(METADATA_KEY.PATH, path ?? '', target);
  };
};

interface ICollected {
  path: string;
  requestMethod: string;
  requestHandler: AsyncFunc;
}
export const routerFactory = <T extends object>(ins: T): ICollected[] => {
  const prototype = Reflect.getPrototypeOf(ins) as any;
  // 提取类（Controller）上 ioc:path - 请求路径 的元数据
  const rootPath = <string>(
    Reflect.getMetadata(METADATA_KEY.PATH, prototype.constructor)
  );

  const methods = <string[]>(
    Reflect.ownKeys(prototype).filter((item) => item !== 'constructor')
  );

  const collected = methods.map((m) => {
    const requestHandler = prototype[m];

    // 提取类方法（GET，POST）上 ioc:method - 请求方法 的元数据
    const path = <string>Reflect.getMetadata(METADATA_KEY.PATH, requestHandler);

    // 提取类方法（GET，POST）上 ioc:method - 请求路径 的元数据
    const requestMethod = <string>(
      Reflect.getMetadata(METADATA_KEY.METHOD, requestHandler).replace(
        'ioc:',
        ''
      )
    );

    // 组装元数据
    return {
      path: `${rootPath}${path}`,
      requestMethod,
      requestHandler,
    };
  });
  return collected;
};

@Controller('/user')
class UserController {
  @Get('/list')
  async userList() {
    return {
      success: true,
      code: 10000,
      data: [
        {
          name: '如常',
          age: 18,
        },
        {
          name: '如梦',
          age: 28,
        },
      ],
    };
  }

  @Post('/add')
  async addUser() {
    return {
      success: true,
      code: 10000,
    };
  }
}

//  
const collected = routerFactory(new UserController());

http
  .createServer((req, res) => {
    for (const info of collected) {
      // 根据请求方法，请求路径，进行路由匹配，执行对应的请求处理函数
      if (
        req.url === info.path &&
        req.method === info.requestMethod.toLocaleUpperCase()
      ) {
        info.requestHandler().then((data) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data));
        });
      }
    }
  })
  .listen(3000)
  .on('listening', () => {
    console.log('Server ready at http://localhost:3000 \n');
    console.log('GET /user/list at http://localhost:3000/user/list \n');
    console.log('POST /user/add at http://localhost:3000/user/add \n');
  });

// what：实现 nest 基于装饰器的路由转发功能
// how：核心在于元数据的注册、提取、组装以及路由匹配，元数据包含了路由的方法，请求路径以及请求处理函数
// why：装饰器模式的实践
