import { suite, test, slow, timeout } from "mocha-typescript";
import { assert } from "chai";
import { RequestBuilder } from "./index";
@suite class RequestBuilderTestSuite {
  @test
  async get() {
    let data = await (new RequestBuilder()).host('httpbin.org').path('/get').build()()
  }
  @test
  async post() {

    let data = await (new RequestBuilder()).host('httpbin.org').method('post').path('/post').build()()
  }
}