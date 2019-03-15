import React from 'react';
import Node from '../../components/Node';
import * as P from '../../pretty';

import {ASTNode, pluralize, descDepth} from '../../ast';


// Binop ABlank Bind Func Sekwence Var Assign Let

// each class has constructor toDescription pretty render

export class Binop extends ASTNode {
  constructor(from, to, op, left, right, options={}) {
    super(from, to, 'binop', ['left', 'right'], options);
    this.op = op;
    this.left = left;
    this.right = right;
  }

  toDescription(level) {
    if ((this.level - level) >= descDepth) return this.options['aria-label'];
    return `a ${this.op} expression with ${this.left.toDescription(level)} and ${this.right.toDescription(level)}`;
  }

  pretty() {
    return P.horzArray([this.left, P.txt(" "), this.op, P.txt(" "), this.right]);
  }

  render(props) {
    return (
      <Node node={this} {...props}>
        <span className="blocks-operator">{this.op}</span>
        {this.left.reactElement()}
        {this.right.reactElement()}
      </Node>
    );
  }
}

export class ABlank extends ASTNode {
  constructor(from, to, options={}) {
    super(from, to, 'a-blank', [], options);
  }

  toDescription(level) {
    if ((this.level - level) >= descDepth) return this.options['aria-label'];
    return `a blank expression`;
  }

  pretty() {
    return P.standardSexpr('Any');
  }

  render(props) {
    return (
      <Node node={this} {...props}>
        <span className="blocks-literal-symbol">BLANK</span>
      </Node>
    );
  }
}

export class Bind extends ASTNode {
  // PTW: not quite sure what this is...
  constructor(from, to, id, ann, options={}) {
    super(from, to, 'bind', ['ann'], options);
    this.id = id;
    this.ann = ann;
  }

  toDescription(level) {
    if ((this.level - level) >= descDepth) return this.options['aria-label'];
    return `a bind expression with ${this.id} and ${this.ann}`;
  }

  pretty() {
    console.log(this.id);
    if (this.ann.type != "a-blank")
      return P.horzArray([this.id.value, P.txt(" :: "), this.ann]);
    else
      return P.horzArray([this.id.value]);
  }

  render(props) {
    return (
      <Node node={this} {...props}>
        <span className="blocks-literal-symbol">{this.id}</span>
      </Node>
    );
  }
}

export class Func extends ASTNode {
  constructor(from, to, name, args, retAnn, doc, body, options={}) {
    super(from, to, 'functionDefinition', ['args', 'retAnn', 'body'], options);
    this.name = name;
    this.args = args;
    this.retAnn = retAnn;
    this.doc = doc;
    this.body = body;
  }

  toDescription(level) {
    if ((this.level - level) >= descDepth) return this.options['aria-label'];
    return `a func expression with ${this.name}, ${this.args} and ${this.body.toDescription(level)}`;
  }

  pretty() {
    return P.horzArray([P.txt("fun "), this.name, P.txt("("), P.horzArray(this.args.map(p => p.pretty())), P.txt(")"), this.body]);
  }

  render(props) {
    // TODO: uncommenting this expression leads to using an object instead of a react element
    let args = /* this.args[0].reactElement() */ undefined;
    let body = this.body.reactElement();
    // console.log(args, body);
    return (
      <Node node={this} {...props}>
        <span className="blocks-operator">{this.name}</span>
        <span className="blocks-args">{args}</span>
        {body}
      </Node>
    );
  }
}

export class Sekwence extends ASTNode {
  constructor(from, to, exprs, name, options={}) {
    super(from, to, 'sekwence', ['exprs'], options);
    this.exprs = exprs;
    this.name = name;
  }

  toDescription(level) {
    if ((this.level - level) >= descDepth) return this.options['aria-label'];
    return `a sequence containing ${this.exprs.toDescription(level)}`;
  }

  pretty() {
    return P.horzArray([P.txt(":"), P.horzArray(this.exprs), P.txt("end")]);
  }

  render(props) {
    // TODO: extend to `exprs` of more than length 1
    return (
      <Node node={this} {...props}>
        <span className="blocks-operator">{this.name}</span>
        {this.exprs[0].reactElement()}
      </Node>
    );
  }
}

export class Var extends ASTNode {
  constructor(from, to, id, rhs, options={}) {
    super(from, to, 'var', ['id', 'rhs'], options);
    this.id = id;
    this.rhs = rhs;
  }

  toDescription(level) {
    if ((this.level - level) >= descDepth) return this.options['aria-label'];
    return `a var setting ${this.id} to ${this.rhs}`;
  }

  pretty() {
    return P.horzArray([this.id, P.txt('var'), this.rhs]);
  }

  render(props) {
    return (
      <Node node={this} {...props}>
        <span className="blocks-operator">VAR</span>
        <span className="block-args">
        {this.id.reactElement()}
        {this.rhs.reactElement()}
        </span>
      </Node>
    );
  }
}

export class Assign extends ASTNode {
  constructor(from, to, id, rhs, options={}) {
    super(from, to, 'assign', ['id', 'rhs'], options);
    this.id = id;
    this.rhs = rhs;
  }

  toDescription(level) {
    if ((this.level - level) >= descDepth) return this.options['aria-label'];
    return `a assign setting ${this.id} to ${this.rhs}`;
  }

  pretty() {
    return P.horzArray([this.id, P.txt(' := '), this.rhs]);
  }

  render(props) {
    return (
      <Node node={this} {...props}>
        <span className="blocks-operator">:=</span>
        <span className="block-args">
        {this.id.reactElement()}
        {this.rhs.reactElement()}
        </span>
      </Node>
    );
  }
}

export class Let extends ASTNode {
  constructor(from, to, id, rhs, options={}) {
    super(from, to, 'let', ['id', 'rhs'], options);
    this.id = id;
    this.rhs = rhs;
  }

  toDescription(level) {
    if ((this.level - level) >= descDepth) return this.options['aria-label'];
    return `a let setting ${this.id} to ${this.rhs}`;
  }

  pretty() {
    return P.horzArray([this.id, P.txt('let'), this.rhs]);
  }

  render(props) {
    return (
      <Node node={this} {...props}>
        <span className="blocks-operator">LET</span>
        <span className="block-args">
        {this.id.reactElement()}
        {this.rhs.reactElement()}
        </span>
      </Node>
    );
  }
}


// where are the literals?