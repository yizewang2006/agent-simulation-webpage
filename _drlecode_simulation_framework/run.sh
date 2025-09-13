#!/bin/bash
#SBATCH --nodes=1
#SBATCH --cpus-per-task=1
#SBATCH --time=14
#SBATCH --mem-per-cpu=16G
#SBATCH --output=output.out
#SBATCH --error=error.err
#SBATCH --partition=node4_queue
#SBATCH --array=1-32

javac core/Main.java
java core/Main