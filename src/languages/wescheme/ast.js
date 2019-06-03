import React from 'react';
import {AST, Pretty as P, Node, NodeSpec as Spec} from '../../../node_modules/codemirror-blocks';

const {pluralize, descDepth} = AST;


export class LetLikeExpr extends AST.ASTNode {
  constructor(from, to, form, bindings, expr, options={}) {
    super(from, to, 'letLikeExpr', options);
    this.form = form;
    this.bindings = bindings;
    this.expr = expr;
  }

  static spec = Spec.nodeSpec([
    Spec.value('form'),
    Spec.required('bindings'),
    Spec.required('expr')
  ])

  toDescription(level){
    if((this.level - level) >= descDepth) return this.options['aria-label'];
    return `a ${this.form} expression with ${pluralize("binding", this.bindings.exprs)}`;
  }

  pretty() {
    return P.lambdaLikeSexpr(this.form, P.brackets(this.bindings), this.expr);
  }

  render(props) {
    return (
      <Node node={this} {...props}>
        <span className="blocks-operator">{this.form}</span>
        {this.bindings.reactElement()}
        {this.expr.reactElement()}
      </Node>
    );
  }
}

export class WhenUnless extends AST.ASTNode {
  constructor(from, to, form, predicate, exprs, options={}) {
    super(from, to, 'whenUnlessExpr', options);
    this.form = form;
    this.predicate = predicate;
    this.exprs = exprs;
  }

  static spec = Spec.nodeSpec([
    Spec.value('form'),
    Spec.required('predicate'),
    Spec.required('exprs')
  ])

  toDescription(level){
    if((this.level - level) >= descDepth) return this.options['aria-label'];
    return `a ${this.form} expression: ${this.form} ${this.predicate.toDescription(level)}, ${this.exprs.toDescription(level)}`;
  }

  pretty() {
    return P.standardSexpr(this.form, [this.predicate, this.exprs]);
  }

  render(props) {
    return (
      <Node node={this} {...props}>
        <span className="blocks-operator">{this.form}</span>
        {this.predicate.reactElement()}
        {this.exprs.reactElement()}
      </Node>
    );
  }
}
