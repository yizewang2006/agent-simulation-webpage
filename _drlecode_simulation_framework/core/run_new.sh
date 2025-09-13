#!/bin/bash
#SBATCH --nodes=1 --ntasks=1
#SBATCH --cpus-per-task=1
#SBATCH --mem-per-cpu=16000M
#SBATCH --time=5760
#SBATCH --output=../output.txt
#SBATCH --error=../error.txt
#SBATCH --partition=qCPU120
#SBATCH --account=CSC112R39
#SBATCH -J hle49
#SBATCH --array=1-32

cd $SCRATCH

cp $IRODS_PROJECT/UNIV1S16/Main.java $SCRATCH

module load NGS/2.10.4-GCCcore-8.3.0-Java-11

javac -cp ../ Main.java
java -cp ../ core/Main

# copying output(output.txt) to the irods projects directory
cp output.txt $IRODS_PROJECT/UNIV1S16/
rm -rf $SCRATCH
