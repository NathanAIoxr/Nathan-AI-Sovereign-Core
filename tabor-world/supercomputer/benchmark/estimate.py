#!/usr/bin/env python3
"""Transparent capacity estimate, NOT a supercomputer performance claim."""
import argparse
import json
import math

def estimate(target_ef, per_node_tflops, efficiency):
    if target_ef <= 0 or per_node_tflops <= 0 or not 0 < efficiency <= 1:
        raise ValueError("Positive target/node performance and efficiency in (0,1] required")
    required = math.ceil(target_ef * 1_000_000 / (per_node_tflops * efficiency))
    return {"target_exaflops": target_ef, "assumed_fp64_tflops_per_node_peak": per_node_tflops,
            "assumed_hpl_efficiency": efficiency, "estimated_nodes": required,
            "is_measured": False, "disclaimer": "Illustrative planning estimate only; networking, memory, cooling, power and HPL scaling are unverified."}

if __name__ == "__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--target-ef",type=float,default=4.396)
    p.add_argument("--node-fp64-tflops",type=float,required=True)
    p.add_argument("--efficiency",type=float,default=0.7)
    a=p.parse_args()
    print(json.dumps(estimate(a.target_ef,a.node_fp64_tflops,a.efficiency),indent=2))
