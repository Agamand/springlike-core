import { suite, test, slow, timeout } from "mocha-typescript";
import chai from 'chai'

import { Service, ServiceRegistry, InjectService, SecurityChecker } from './index';

@Service
class TestService {
  context: any = null;
  testMethod() {
    return "test";
  }


  testContext() {
    return this.context;
  }

  @SecurityChecker((context: any) => { return context === "testContext"; })
  testSecurity() {
    return "success";
  }


}

@Service
class TestService2 {
  context: any = null;
  @InjectService
  service: TestService;

  testMethod() {
    return "test" + this.service.testMethod();
  }


  testContext() {
    return this.service.testContext();
  }


}






@suite class ServiceTest {
  @test
  testNominal() {
    let service = ServiceRegistry.get<TestService>(TestService.name);
    chai.expect(service.testMethod()).to.be.eq("test");
    chai.expect(service.testContext()).to.be.eq(null);
  }
  @test
  testServiceOfService() {
    let service = ServiceRegistry.get<TestService2>(TestService2.name);
    chai.expect(service.testMethod()).to.be.eq("testtest");
    chai.expect(service.testContext()).to.be.eq(null);
  }
  @test
  testServiceContext() {
    let service = ServiceRegistry.get<TestService>(TestService.name, "testContext");
    let service2 = ServiceRegistry.get<TestService>(TestService.name, "testContext2");
    chai.expect(service.testMethod()).to.be.eq("test");
    chai.expect(service.testContext()).to.be.eq("testContext");
    chai.expect(service2.testMethod()).to.be.eq("test");
    chai.expect(service2.testContext()).to.be.eq("testContext2");
  }
  @test
  testServiceContextOfService() {
    let service = ServiceRegistry.get<TestService2>(TestService2.name, "testContext");
    let service2 = ServiceRegistry.get<TestService2>(TestService2.name, "testContext2");
    chai.expect(service.testMethod()).to.be.eq("testtest");
    chai.expect(service.testContext()).to.be.eq("testContext");
    chai.expect(service2.testMethod()).to.be.eq("testtest");
    chai.expect(service2.testContext()).to.be.eq("testContext2");
  }
  @test
  testServiceSecurityNoContext() {
    let service = ServiceRegistry.get<TestService>(TestService.name);
    chai.expect(service.testSecurity()).to.be.eq("success");
  }
  @test
  testServiceSecurityGoodContext() {
    let service = ServiceRegistry.get<TestService>(TestService.name, "testContext");
    chai.expect(service.testSecurity()).to.be.eq("success");
  }
  @test
  testServiceSecurityBadContext() {
    let service = ServiceRegistry.get<TestService>(TestService.name, "badContext");
    var testSecurity = function () {
      try {
        service.testSecurity()
      } catch (error) {
        throw new TypeError(error.message);
      }
    };

    chai.expect(testSecurity).to.throw('invalid access');
  }
}