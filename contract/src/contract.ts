import { NearBindgen, initialize, call, near, NearPromise } from "near-sdk-js";
import { AccountId } from "near-sdk-js/lib/types";

const FIVE_TGAS = BigInt("5000000000000");
const TEN_TGAS = BigInt("10000000000000");
const NO_DEPOSIT = BigInt(0);
const NO_ARGS = JSON.stringify({});

@NearBindgen({})
class CrossContractCall {
  hello_account: AccountId = "hello-nearverse.testnet";

  @initialize({})
  init({ hello_account }: { hello_account: AccountId }) {
    this.hello_account = hello_account
  }

  @call({})
  query_greeting(): NearPromise {
    const promise = NearPromise.new(this.hello_account)
    .functionCall("get_greeting", NO_ARGS, NO_DEPOSIT, FIVE_TGAS)
    .then(
      NearPromise.new(near.currentAccountId())
      .functionCall("query_greeting_callback", NO_ARGS, NO_DEPOSIT, TEN_TGAS)
    )
    
    return promise.asReturn();
  }

  @call({ privateFunction: true })
  query_greeting_callback(): String {
    let { result, success } = promiseResult(1);

    if (success) {
      return result.substring(1, result.length-1);
    } else {
      near.log("Promise failed...")
      return ""
    }
  }

  @call({})
  change_greeting({ new_greeting }: { new_greeting: string }): NearPromise {
    const promise = NearPromise.new(this.hello_account)
    .functionCall("set_greeting", JSON.stringify({ greeting: new_greeting }), NO_DEPOSIT, FIVE_TGAS)
    .then(
      NearPromise.new(near.currentAccountId())
      .functionCall("change_greeting_callback", NO_ARGS, NO_DEPOSIT, TEN_TGAS)
    )

    return promise.asReturn();
  }

  @call({privateFunction: true})
  change_greeting_callback(): boolean {
    let { success } = promiseResult(1);

    if (success) {
      near.log(`Success!`);
      return true;
    } else {
      near.log("Promise failed...");
      return false;
    }
  }

  @call({})
  batch_actions({ new_greeting }: { new_greeting: string }): NearPromise {
    const promise = NearPromise.new(this.hello_account)
    .functionCall("set_greeting", JSON.stringify({ message: new_greeting }), NO_DEPOSIT, FIVE_TGAS)
    .functionCall("get_greeting", NO_ARGS, NO_DEPOSIT, FIVE_TGAS)
    .functionCall("set_greeting", JSON.stringify({ message: 'Hi' }), NO_DEPOSIT, FIVE_TGAS)
    .functionCall("get_greeting", NO_ARGS, NO_DEPOSIT, FIVE_TGAS)
    .then(
      NearPromise.new(near.currentAccountId())
      .functionCall("batch_actions_callback", NO_ARGS, NO_DEPOSIT, TEN_TGAS)
    )

    return promise.asReturn();
  }

  @call({privateFunction: true})
  batch_actions_callback(): string {
    let { success, result } = promiseResult(1);

    if (success) {
      near.log(`Success! Result: ${result}`);
      return result;
    } else {
      near.log("Promise failed...");
      return "";
    }
  }

  @call({})
  multiple_contracts(): NearPromise {
    const promise1 = NearPromise.new(this.hello_account)
    .functionCall("get_greeting", NO_ARGS, NO_DEPOSIT, FIVE_TGAS)
    const promise2 = NearPromise.new(this.hello_account)
    .functionCall("get_greeting", NO_ARGS, NO_DEPOSIT, FIVE_TGAS)
    const promise3 = NearPromise.new(this.hello_account)
    .functionCall("get_greeting", NO_ARGS, NO_DEPOSIT, FIVE_TGAS)

    return promise1
    .and(promise2)
    .and(promise3)
    .then(
      NearPromise.new(near.currentAccountId())
      .functionCall("multiple_contracts_callback", JSON.stringify({ number_promises: 3 }), NO_DEPOSIT, TEN_TGAS)
    )
  }

  @call({privateFunction: true})
  multiple_contracts_callback({ number_promises }: { number_promises: number }): string {
    let { success, result } = promiseResult(number_promises);

    if (success) {
      near.log(`Success! Result: ${result}`);
      return result;
    } else {
      near.log("Promise failed...");
      return "";
    }
  }
}

function promiseResult(number_promises): { result: string, success: boolean } {
  let result, success;
  
  try {
    result = [];
    for (let i = 0; i < number_promises; i ++) {
      result.push(near.promiseResult(i));
    }
    success = true;
  } catch {
    result = undefined;
    success = false;
  }
  
  return {
    result,
    success,
  }
}