var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import 'reflect-metadata';
import http from "http";
export var METADATA_KEY;
(function (METADATA_KEY) {
    METADATA_KEY["METHOD"] = "ioc:method";
    METADATA_KEY["PATH"] = "ioc:path";
    METADATA_KEY["MIDDLEWARE"] = "ioc:middleware";
})(METADATA_KEY || (METADATA_KEY = {}));
export var REQUEST_METHOD;
(function (REQUEST_METHOD) {
    REQUEST_METHOD["GET"] = "ioc:get";
    REQUEST_METHOD["POST"] = "ioc:post";
})(REQUEST_METHOD || (REQUEST_METHOD = {}));
export const methodDecoratorFactory = (method) => {
    return (path) => {
        return (_target, _key, descriptor) => {
            // 在类方法实现上注册 ioc:method - 请求方法 的元数据
            Reflect.defineMetadata(METADATA_KEY.METHOD, method, descriptor.value);
            // 在类方法实现上注册 ioc:path - 请求路径 的元数据
            Reflect.defineMetadata(METADATA_KEY.PATH, path, descriptor.value);
        };
    };
};
export const Get = methodDecoratorFactory(REQUEST_METHOD.GET);
export const Post = methodDecoratorFactory(REQUEST_METHOD.POST);
export const Controller = (path) => {
    return (target) => {
        Reflect.defineMetadata(METADATA_KEY.PATH, path ?? '', target);
    };
};
export const routerFactory = (ins) => {
    const prototype = Reflect.getPrototypeOf(ins);
    // 提取类（Controller）上 ioc:path - 请求路径 的元数据
    const rootPath = (Reflect.getMetadata(METADATA_KEY.PATH, prototype.constructor));
    const methods = (Reflect.ownKeys(prototype).filter((item) => item !== 'constructor'));
    const collected = methods.map((m) => {
        const requestHandler = prototype[m];
        // 提取类方法（GET，POST）上 ioc:method - 请求方法 的元数据
        const path = Reflect.getMetadata(METADATA_KEY.PATH, requestHandler);
        // 提取类方法（GET，POST）上 ioc:method - 请求路径 的元数据
        const requestMethod = (Reflect.getMetadata(METADATA_KEY.METHOD, requestHandler).replace('ioc:', ''));
        // 组装元数据
        return {
            path: `${rootPath}${path}`,
            requestMethod,
            requestHandler,
        };
    });
    return collected;
};
let UserController = class UserController {
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
    async addUser() {
        return {
            success: true,
            code: 10000,
        };
    }
};
__decorate([
    Get('/list'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "userList", null);
__decorate([
    Post('/add'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "addUser", null);
UserController = __decorate([
    Controller('/user')
], UserController);
//  
const collected = routerFactory(new UserController());
http
    .createServer((req, res) => {
    for (const info of collected) {
        // 根据请求方法，请求路径，进行路由匹配，执行对应的请求处理函数
        if (req.url === info.path &&
            req.method === info.requestMethod.toLocaleUpperCase()) {
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
