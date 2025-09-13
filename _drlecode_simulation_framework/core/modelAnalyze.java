package core;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Random;

import activation_function.Activation_function_binary;
import activation_function.Activation_function_linear;
import behavior.Behavior;
import behavior.BehaviorGroup;
import entities.Entity;
import filters.Filter;
import filters.Filter_ranged;
import searchMethod.GeneticAlgorithm;

public class modelAnalyze 
{
	public ArrayList<Model> model_database = new ArrayList<Model>();
	
	
	public modelAnalyze(ArrayList<Model> model_list) throws IOException
	{
		//Shadow copy is good here
		//We just read the data, not modify anything
		
		model_database = model_list;
		
		// Sort models base on fitnessMetric
		//Collections.sort(model_database, new SortbyFitnessMetric());
				
	}
	
	//FInd out which behavior is unneccessary 
	public void simplifyModel(double score_low, double score_high) throws InterruptedException, IOException
	{
		
	}
}
