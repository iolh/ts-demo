import "reflect-metadata";

type ClassStruct<T = any> = new (...args: any[]) => T;

class Container {
  private static classRegistry = new Map<string | ClassStruct, ClassStruct>();
  private static propertyRegistry = new Map<string, any>();
  // 延迟创建
  public static get(key: string) {
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
      if (classKey !== Const.name) continue;
      inst[propKey] = Container.get(serviceKey);
    }

    return inst;
  }
  public static set(key: string, target: ClassStruct) {
    this.classRegistry.set(key, target);
  }
  public static setServiceKey(key: string, serviceKey: string) {
    this.propertyRegistry.set(key, serviceKey);
  }
}

function Provide(): ClassDecorator {
  return (target) => {
    Container.set(target.name, target as unknown as ClassStruct);
    Container.set(target as any, target as unknown as ClassStruct);
  };
}

function Inject(): PropertyDecorator {
  return (target, propertyKey) => {
    let type = Reflect.getMetadata("design:type", target, propertyKey);
    console.log(type);
    Container.setServiceKey(
      `${target.constructor.name}:${propertyKey as any}`,
      type
    );
  };
}

// usage:
@Provide() //
class Driver {
  adapt(consumer: string) {
    console.log(`\n === 驱动已生效于 ${consumer}！===\n`);
  }
}

@Provide() // 自动注册
class Car {
  @Inject() // 自动注入
  driver!: Driver;

  run() {
    this.driver.adapt("Car");
  }
}

const car = Container.get("Car")!;

car.run();

// console.log(Car)

// 思路：
// what: 依赖的自动创建和注入
// how: 通过ioc容器和依赖注入技术实现
// why: 依赖倒置原则的实践
