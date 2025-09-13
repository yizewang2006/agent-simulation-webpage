#!/bin/bash
#SBATCH --nodes=1
#SBATCH --cpus-per-task=1
#SBATCH --mem-per-cpu=16G
#SBATCH --time=2-02:30:00
#SBATCH --output=output.out
#SBATCH --error=error.err
#SBATCH --partition=node4_queue


module load Compilers/JavaSDK1.8

javac core/Main.java
java core/Main