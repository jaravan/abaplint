import {Issue} from "../issue";
import {BasicRuleConfig} from "./_basic_rule_config";
import {IRegistry} from "../_iregistry";
import {MessageClass} from "../objects";
import {IRule, IRuleMetadata} from "./_irule";
import {IObject} from "../objects/_iobject";
import {Position} from "../position";

export class MSAGConsistencyConf extends BasicRuleConfig {
}

export class MSAGConsistency implements IRule {
  private conf = new MSAGConsistencyConf();

  public getMetadata(): IRuleMetadata {
    return {
      key: "msag_consistency",
      title: "MSAG consistency check",
      shortDescription: `Checks the validity of messages in message classes`,
      extendedInformation: `Message numbers must be 3 digits, message text must not be empty, no message number duplicates`,
    };
  }

  private getDescription(reason: string): string {
    return "Message class invalid: " + reason;
  }

  public getConfig() {
    return this.conf;
  }

  public setConfig(conf: MSAGConsistencyConf) {
    this.conf = conf;
  }

  public initialize(_reg: IRegistry) {
    return this;
  }

  public run(obj: IObject): Issue[] {
    const issues: Issue[] = [];

    if (!(obj instanceof MessageClass)) {
      return [];
    }

    const numbers = new Set<string>();

    for (const message of obj.getMessages()) {
// todo, get the right positions in xml file
      if (!message.getNumber().match(/\d\d\d/)) {
        const text = this.getDescription("Message number must be 3 digits: message " + message.getNumber());
        const position = new Position(1, 1);
        const issue = Issue.atPosition(obj.getFiles()[0], position, text, this.getMetadata().key, this.conf.severity);
        issues.push(issue);
      }
      if (message.getMessage() === "") {
        const text = "Message text empty: message " + message.getNumber();
        const position = new Position(1, 1);
        const issue = Issue.atPosition(obj.getFiles()[0], position, text, this.getMetadata().key, this.conf.severity);
        issues.push(issue);
      }

      const num = message.getNumber();
      if (numbers.has(num)) {
        const text = "Duplicate message number " + num;
        const position = new Position(1, 1);
        const issue = Issue.atPosition(obj.getFiles()[0], position, text, this.getMetadata().key, this.conf.severity);
        issues.push(issue);
      } else {
        numbers.add(num);
      }
    }

    return issues;
  }
}