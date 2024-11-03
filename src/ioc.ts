type ClassStruct<T = any> = new (...args: any[]) => T;


function Provide(key: string): ClassDecorator {
  return (Target) => {
    Container.set(key, Target as unknown as ClassStruct);
  };
}

type ServiceKey<T = any> = string | ClassStruct<T> | Function;

class Container {
  public static propertyRegistry: Map<string, string> = new Map();
  private static services: Map<ServiceKey, ClassStruct> = new Map();

  public static get<T = any>(key: ServiceKey): T | undefined {
    // 检查是否注册
    const Cons = Container.services.get(key);

    if (!Cons) {
      return undefined;
    }

    // 实例化这个类
    const ins = new Cons();

    // 遍历注册信息
    for (const info of Container.propertyRegistry) {
      // 注入标识符与要注入类的标识符
      const [injectKey, serviceKey] = info;
      // 拆分为 Class 名与属性名
      const [classKey, propKey] = injectKey.split(':');

      // 如果不是这个类，就跳过
      if (classKey !== Cons.name) continue;

      // 取出需要注入的类，这里拿到的是已经实例化的
      const target = Container.get(serviceKey);

      if (target) {
        // 赋值给对应的属性
        ins[propKey] = target;
      }
    }

    return ins;
  }
  public static set(key: string, value: ClassStruct): void {
    Container.services.set(key, value);
  }
}


function Inject(key: string): PropertyDecorator {
  return (target, propertyKey) => {
    Container.propertyRegistry.set(
      `${target.constructor.name}:${String(propertyKey)}`,
      key
    );
  };
}

@Provide('DriverService')
class Driver {
  adapt(consumer: string) {
    console.log(`\n === 驱动已生效于 ${consumer}！===\n`);
  }
}

@Provide('Car')
class Car {
  @Inject('DriverService')
  driver!: Driver;

  run() {
    this.driver.adapt('Car');
  }
}

const car = Container.get<Car>('Car')!;

car.run();



// @Provide()
// class Driver {
//   adapt(consumer: string) {
//     console.log(`\n === 驱动已生效于 ${consumer}！===\n`);
//   }
// }

// @Provide()
// class Car {
//   @Inject()
//   driver!: Driver;

//   run() {
//     this.driver.adapt('Car');
//   }
// }

// const car = Container.get(Car);

// car.run(); // 驱动已生效于 Car ！