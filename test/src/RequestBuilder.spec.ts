import { suite, test, slow, timeout } from "mocha-typescript";
import * as chai from "chai";
import chaiAsPromised from 'chai-as-promised'
import { RequestBuilder } from "./index";
chai.use(chaiAsPromised);

@suite class RequestBuilderTestSuite {

  @test
  async postNominal() {
    let data = await (new RequestBuilder()).host('httpbin.org').method('post').path('/post').build()()
  }

  @test
  async getNominal() {
    let data = await (new RequestBuilder()).host('httpbin.org').path('/get').build()()
  }

  @test
  async putNominal() {
    let data = await (new RequestBuilder()).host('httpbin.org').method('put').path('/put').build()()
  }

  @test
  async deleteNominal() {
    let data = await (new RequestBuilder()).host('httpbin.org').method('delete').path('/delete').build()()
  }

  @test
  async postError() {
    chai.expect((new RequestBuilder()).host('httpbin.org').method('post').path('/get').build()()).to.be.rejected;
  }

  @test
  async getError() {
    chai.expect((new RequestBuilder()).host('httpbin.org').method('get').path('/post').build()()).to.be.rejected;
  }

  @test
  async putError() {
    chai.expect((new RequestBuilder()).host('httpbin.org').method('put').path('/delete').build()()).to.be.rejected;
  }

  @test
  async deleteError() {
    chai.expect((new RequestBuilder()).host('httpbin.org').method('delete').path('/put').build()()).to.be.rejected;
  }

  @test
  async queryParam() {
    let data = await (new RequestBuilder()).host('httpbin.org').param('query', 'q1', "d1").path('/get').build()()
    chai.assert.equal(data.body.args.q1, "d1")
  }
  @test
  async pathParam() {
    let data = await (new RequestBuilder()).host('httpbin.org').param('path', 'pp', "get").path('/:pp').build()()
  }
}