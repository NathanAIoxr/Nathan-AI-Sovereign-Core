#!/usr/bin/env python3
"""Focused consumer lint. Trusted primitive internals own necessary arithmetic.

This is a syntactic guard, not a general program correctness proof.
"""
import ast
from pathlib import Path


def violations(source):
    findings = []
    tree = ast.parse(source)
    for node in ast.walk(tree):
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "range":
            if any(isinstance(arg, ast.Call) and isinstance(arg.func, ast.Name) and arg.func.id == "len" for arg in node.args):
                findings.append((node.lineno, "iterate values instead of range(len(...))"))
        if isinstance(node, ast.Compare):
            for operator, comparator in zip(node.ops, node.comparators):
                if (isinstance(operator, ast.LtE) and isinstance(comparator, ast.Call)
                        and isinstance(comparator.func, ast.Name) and comparator.func.id == "len"):
                    findings.append((node.lineno, "inclusive collection upper bound"))
    return findings


def main():
    consumer = Path(__file__).with_name("boundary_api.py")
    findings = violations(consumer.read_text())
    for line, message in findings:
        print(f"{consumer.name}:{line}: {message}")
    if findings:
        raise SystemExit(1)
    print("Boundary consumer lint passed")


if __name__ == "__main__": main()
