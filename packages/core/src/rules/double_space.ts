import {Issue} from "../issue";
import {ABAPRule} from "./_abap_rule";
import {BasicRuleConfig} from "./_basic_rule_config";
import {Token} from "../abap/1_lexer/tokens/_token";
import {ParenLeftW, Comment, WParenRightW, WParenRight} from "../abap/1_lexer/tokens";
import {TokenNode, StatementNode, TokenNodeRegex} from "../abap/nodes";
import {Unknown, MacroContent, MacroCall} from "../abap/2_statements/statements/_statement";
import {Events, MethodDef} from "../abap/2_statements/statements";
import {Position} from "../position";
import {EditHelper} from "../edit_helper";
import {IRuleMetadata, RuleTag} from "./_irule";
import {ABAPFile} from "../abap/abap_file";

export class DoubleSpaceConf extends BasicRuleConfig {
  /** Check for double space after keywords */
  public keywords: boolean = true;
  /** Check for double space after start parenthesis */
  public startParen: boolean = true;
  /** Check for double space before end parenthesis */
  public endParen: boolean = true;
  /** Check for double space after colon/chaining operator */
  public afterColon: boolean = true;
}

export class DoubleSpace extends ABAPRule {

  private conf = new DoubleSpaceConf();

  public getMetadata(): IRuleMetadata {
    return {
      key: "double_space",
      title: "Double space",
      shortDescription: `Checks that only a single space follows certain common statements.`,
      tags: [RuleTag.Whitespace, RuleTag.Quickfix, RuleTag.SingleFile],
      badExample: `DATA  foo TYPE i.`,
      goodExample: `DATA foo TYPE i.`,
    };
  }

  private getMessage(): string {
    return "Remove double space";
  }

  public getConfig() {
    return this.conf;
  }

  public setConfig(conf: DoubleSpaceConf) {
    this.conf = conf;
  }

  public runParsed(file: ABAPFile) {
    let issues: Issue[] = [];

    for (const s of file.getStatements()) {

      if (this.conf.keywords === true
          && !(s.get() instanceof Unknown)
          && !(s.get() instanceof MethodDef)
          && !(s.get() instanceof MacroCall)
          && !(s.get() instanceof Events)
          && !(s.get() instanceof MacroContent)) {
        issues = issues.concat(this.checkKeywords(s, file));
      }

      issues = issues.concat(this.checkParen(s, file));
    }

    issues = issues.concat(this.checkAfterColon(file));

    return issues;
  }

  private checkAfterColon(file: ABAPFile): Issue[] {
    const issues: Issue[] = [];
    let cPosition: Position | undefined = undefined;

    if (this.conf.afterColon !== true) {
      return [];
    }

    for (const s of file.getStatements()) {
      const colon = s.getColon();
      if (colon === undefined) {
        continue;
      } else if (cPosition !== undefined && cPosition.getCol() === colon.getCol()) {
        continue;
      }

      cPosition = colon.getStart();

      for (const t of s.getTokens()) {
        if (t.getRow() !== cPosition.getRow()) {
          return [];
        } else if (t.getCol() < cPosition.getCol()) {
          continue;
        }

        if (t.getCol() > cPosition.getCol() + 2) {
          const issueStartPos = new Position(cPosition.getRow(), cPosition.getCol() + 2);
          const issueEndPos = new Position(t.getRow(), t.getCol());
          const fix = EditHelper.deleteRange(file, issueStartPos, issueEndPos);
          issues.push(Issue.atRange(file, issueStartPos, issueEndPos, this.getMessage(), this.getMetadata().key, this.conf.severity, fix));
        }

        break;
      }
    }

    return issues;
  }

  private checkParen(s: StatementNode, file: ABAPFile): Issue[] {
    const issues: Issue[] = [];

    let prev: Token | undefined = undefined;
    for (const t of s.getTokens()) {
      if (prev === undefined) {
        prev = t;
        continue;
      }

      if (this.getConfig().startParen === true
          && prev.getRow() === t.getRow()
          && prev instanceof ParenLeftW
          && !(t instanceof Comment)
          && prev.getEnd().getCol() + 1 < t.getCol()) {
        const issueStartPos = new Position(prev.getRow(), prev.getCol() + 2);
        const issueEndPos = new Position(t.getRow(), t.getCol());
        const fix = EditHelper.deleteRange(file, issueStartPos, issueEndPos);
        if (this.pragmaInRange(s.getPragmas(), issueStartPos, issueEndPos) === false) {
          issues.push(Issue.atRange(file, issueStartPos, issueEndPos, this.getMessage(), this.getMetadata().key, this.conf.severity, fix));
        }
      }

      if (this.getConfig().endParen === true
          && prev.getRow() === t.getRow()
          && !(prev instanceof ParenLeftW)
          && (t instanceof WParenRightW || t instanceof WParenRight)
          && prev.getEnd().getCol() + 1 < t.getCol()) {
        const issueStartPos = new Position(prev.getEnd().getRow(), prev.getEnd().getCol() + 1);
        const issueEndPos = new Position(t.getRow(), t.getCol());
        const fix = EditHelper.deleteRange(file, issueStartPos, issueEndPos);
        if (this.pragmaInRange(s.getPragmas(), issueStartPos, issueEndPos) === false) {
          issues.push(Issue.atRange(file, issueStartPos, issueEndPos, this.getMessage(), this.getMetadata().key, this.conf.severity, fix));
        }
      }

      prev = t;
    }

    return issues;
  }

  private pragmaInRange(pragmas: readonly Token[], start: Position, end: Position): boolean {
    let ret = false;
    for (const p of pragmas) {
      if (p.getStart().isBetween(start, end)) {
        ret = true;
      }
    }
    return ret;
  }

  private checkKeywords(s: StatementNode, file: ABAPFile): Issue[] {
    const issues: Issue[] = [];
    let prev: TokenNode | undefined = undefined;

    if (s.getColon() !== undefined || s.getPragmas().length > 0) {
      // for chained statments just give up
      return [];
    }

    for (const n of s.getTokenNodes()) {
      if (prev === undefined) {
        prev = n;
        continue;
      }

      const upper = prev.get().getStr().toUpperCase();
      if (prev instanceof TokenNodeRegex
          || upper === "("
          || upper === ")"
          || upper === "CHANGING"
          || upper === "EXPORTING"
          || upper === "OTHERS") {
        // not a keyword, continue
        prev = n;
        continue;
      }

      if (prev.get().getStart().getRow() === n.get().getStart().getRow()
          && prev.get().getEnd().getCol() + 1 < n.get().getStart().getCol()) {
        const issueStartPos = new Position(prev.get().getEnd().getRow(), prev.get().getEnd().getCol() + 1 );
        const issueEndPos = new Position(n.get().getRow(), n.get().getCol());
        const fix = EditHelper.deleteRange(file, issueStartPos, issueEndPos);
        issues.push(Issue.atRange( file, issueStartPos, issueEndPos, this.getMessage(), this.getMetadata().key, this.conf.severity, fix));
        return issues;
      }

      prev = n;
    }
    return [];
  }

}