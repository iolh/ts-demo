var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import "reflect-metadata";
class Container {
    // 延迟创建
    static get(key) {
        const Const = this.classRegistry.get(key);
        if (!Const) {
            return undefined;
        }
        const inst = new Const();
        // 遍历所有实例属性
        for (const info of this.propertyRegistry) {
            // 依赖的自动注入
            const [injectServiceKey, serviceKey] = info;
            const [classKey, propKey] = injectServiceKey.split(':');
            if (classKey !== Const.name)
                continue;
            inst[propKey] = Container.get(serviceKey);
        }
        return inst;
    }
    static set(key, target) {
        this.classRegistry.set(key, target);
    }
    static setServiceKey(key, serviceKey) {
        this.propertyRegistry.set(key, serviceKey);
    }
}
Object.defineProperty(Container, "classRegistry", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Map()
});
Object.defineProperty(Container, "propertyRegistry", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Map()
});
function Provide() {
    return (target) => {
        Container.set(target.name, target);
        Container.set(target, target);
    };
}
function Inject() {
    return (target, propertyKey) => {
        let type = Reflect.getMetadata("design:type", target, propertyKey);
        console.log(type);
        Container.setServiceKey(`${target.constructor.name}:${propertyKey}`, type);
    };
}
// usage:
let Driver = class Driver {
    adapt(consumer) {
        console.log(`\n === 驱动已生效于 ${consumer}！===\n`);
    }
};
Driver = __decorate([
    Provide() //
], Driver);
let Car = class Car {
    constructor() {
        Object.defineProperty(this, "driver", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    run() {
        this.driver.adapt("Car");
    }
};
__decorate([
    Inject() // 自动注入
    ,
    __metadata("design:type", Driver)
], Car.prototype, "driver", void 0);
Car = __decorate([
    Provide() // 自动注册
], Car);
const car = Container.get("Car");
car.run();
// console.log(Car)
// 思路：
// what: 依赖的自动创建和注入
// how: 通过ioc容器和依赖注入技术实现
// why: 依赖倒置原则的实践
