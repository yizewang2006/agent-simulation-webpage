 package core;

import java.awt.Color;
import java.awt.Graphics;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
//import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.Random;
import java.util.concurrent.ThreadLocalRandom;

import Action.Action;
import Action.NeighborReference;
import Action.SelfReference;
import Action.SpaceReference_Expand;
import Action.SpaceReference_Static;
import Activation.*;
import Activation_getCheckingValue.*;
import Goal.Goal;
import Goal.Goal_point;
import Goal.Goal_rectangle;
import Utility.DataStruct_Cellspace_Setting;
import Utility.GlobalVariable;
import Utility.myUtility;
import activation_function.Activation_function;
import activation_function.Activation_function_binary;
import activation_function.Activation_function_linear;
import agents.Agent;
import agents.Position;
import agents.Property;
import agents.agentGenerator;
import behavior.Behavior;
import behavior.BehaviorGroup;
import behavior.BehaviorTemplate;
import behavior.Constraint;
import displayWindow.MainGUI;
import displayWindow.trackFitnessScore;
import entities.Entity;
import filters.Filter;
import filters.Filter_method;
import filters.Filter_ranged;
import fitnessFuntcion.fitness_score_list;
import obstacles.Obstacle;
import obstacles.Obstacle_circle;
import obstacles.Obstacle_rectangle;
import searchMethod.GeneticAlgorithm;
import searchMethod.SearchSpace;
import searchMethod.filterTemplate_dataStructure;
import searchMethod.modelTracker;
import zones.Zone;
import zones.Zone_rectangle;
import zones.Zone_triangle;

import java.io.File;  // Import the File class
import java.io.FileNotFoundException;  // Import this class to handle errors
import java.io.FileReader;
import java.util.Scanner; // Import the Scanner class to read text files

public class Main {
	// Run model
	// model array list works as populations for GA
	public static ArrayList<Model> models = new ArrayList<Model>();

	public static Model best_model = null;
	
	public static GlobalVariable global_var = new GlobalVariable();
	
	public static myUtility utility = new myUtility();
	
	// Constraint Set
	public static ArrayList<Constraint> constraint_set = new ArrayList<Constraint>();

	public static ArrayList<Filter> filter_chain = new ArrayList<Filter>();

	public static ArrayList<Agent> agents = new ArrayList<Agent>();

	public static ArrayList<Zone> zones = new ArrayList<Zone>();

	public static ArrayList<Goal> goals = new ArrayList<Goal>();
	
	public static ArrayList<ArrayList<Agent>> agents_list = new ArrayList<ArrayList<Agent>>();

	public static ArrayList<Obstacle> obstacles = new ArrayList<Obstacle>();

	

	// public static ArrayList<Double> fitness_score_tracker = new
	// ArrayList<Double>();

	public static ArrayList<fitness_score_list> fitness_score_tracker = new ArrayList<fitness_score_list>();

	public static ArrayList<modelTracker> model_tracker = new ArrayList<modelTracker>();

	public static ArrayList<Entity> entities = new ArrayList<Entity>();

	public static ArrayList<agentGenerator> a_generator = new ArrayList<agentGenerator>();

	public static SearchSpace searchSpace = new SearchSpace();
	
	public static ArrayList<BehaviorTemplate> B_template = new ArrayList<BehaviorTemplate>();
	
	public static Activation activation = new Activation();
	
	public static Action action = new Action();
	
	public static int goal_set_index = 0;
	
	public static int thickness = 60;
	
	public static ArrayList<Double> finish_time_list = new ArrayList<Double>();
	
	public static ArrayList<Double> agent_remain_list = new ArrayList<Double>();
	public static ArrayList<Double> collision_list = new ArrayList<Double>();
	
	public static ArrayList<Double> distance_leader_list = new ArrayList<Double>();
	
	public static ArrayList<Integer> success_crossover = new ArrayList<Integer>();
	public static ArrayList<Integer> success_mutation = new ArrayList<Integer>();
	
	
	public static void main(String[] args) throws IOException, InterruptedException 
	{		

		// Create the zone
		// ZONE now should only contain the space where agent can move

		// Zone z1 = new Zone(new Position(350,50),50,250);
		int thickness = 30;

		
		String s_preset = 
				   ""
				;
		
		String s_set =  
				 "Behavior Group #0\n"
				 + "Extracted property: 3.0 (Speed)\n"
				 + "   + Behavior #0\n"
				 + "	*** Activation\n"
				 + "		+ Activation property: 3.0\n"
				 + "		+ LowerRange: 0.0\n"
				 + "		+ UpperRange: 180.0\n"
				 + "		+ Check Set: []\n"
				 + "		+ Option: 3 _ Check space_property\n"
				 + "		+ AF type: 1 (Binary AF)\n"
				 + "			+ AF inside: true\n"
				 + "			+ Weight: 20.0\n"
				 + "		+ Null activation: false\n"
				 + "		+ Act on empty segment: 1\n"
				 + "		+ Segment com filter: 3.0\n"
				 + "		+ Segment distance filter: 1\n"
				 + "		+ Filter: #0\n"
				 + "			+ Filtered property: 3.0\n"
				 + "			+ Numeritc ranged: [0.0 , 120.0]\n"
				 + "			+ Category ranged: []\n"
				 + "		+ Filter: #1\n"
				 + "			+ Filtered property: 2.0\n"
				 + "			+ Numeritc ranged: [40.0 , 61.0]\n"
				 + "			+ Category ranged: []\n"
				 + "	*** Action\n"
				 + "		+ Option: 0 (Self reference)\n"
				 + "		+ Offset: 2.0\n"
				 + "   + Behavior #1\n"
				 + "	*** Activation\n"
				 + "		+ Activation property: 1.0\n"
				 + "		+ LowerRange: 0.0\n"
				 + "		+ UpperRange: 120.0\n"
				 + "		+ Check Set: []\n"
				 + "		+ Option: 3 _ Check space_property\n"
				 + "		+ AF type: 1 (Binary AF)\n"
				 + "			+ AF inside: true\n"
				 + "			+ Weight: 20.0\n"
				 + "		+ Null activation: false\n"
				 + "		+ Act on empty segment: 1\n"
				 + "		+ Segment com filter: 1.0\n"
				 + "		+ Segment distance filter: 1\n"
				 + "		+ Filter: #0\n"
				 + "			+ Filtered property: 1.0\n"
				 + "			+ Numeritc ranged: [0.0 , 150.0]\n"
				 + "			+ Category ranged: []\n"
				 + "		+ Filter: #1\n"
				 + "			+ Filtered property: 3.0\n"
				 + "			+ Numeritc ranged: [0.0 , 30.0]\n"
				 + "			+ Category ranged: []\n"
				 + "	*** Action\n"
				 + "		+ Option: 0 (Self reference)\n"
				 + "		+ Offset: 1.0\n"
				 + "\n"
				 + "Behavior Group #1\n"
				 + "Extracted property: 2.0 (Angle)\n"
				 + "   + Behavior #0\n"
				 + "	*** Activation\n"
				 + "		+ Activation property: 1.0\n"
				 + "		+ LowerRange: 0.0\n"
				 + "		+ UpperRange: 60.0\n"
				 + "		+ Check Set: []\n"
				 + "		+ Option: 2 _ Check neighbor_property \n"
				 + "		+ AF type: 2 (Linear AF)\n"
				 + "			+ AF slope: 50.0\n"
				 + "			+ AF increase: false\n"
				 + "		+ Null activation: false\n"
				 + "		+ Filter: #0\n"
				 + "			+ Filtered property: 3.0\n"
				 + "			+ Numeritc ranged: [0.0 , 1.5]\n"
				 + "			+ Category ranged: []\n"
				 + "		+ Filter: #1\n"
				 + "			+ Filtered property: 1.0\n"
				 + "			+ Combine method: 1 (Relative: nearest)\n"
				 + "	*** Action\n"
				 + "		+ Option: 1 (Neighbor reference)\n"
				 + "		+ Offset: 0.0\n"
				 + "		+ Filter: #0\n"
				 + "			+ Filtered property: 3.0\n"
				 + "			+ Numeritc ranged: [0.0 , 1.5]\n"
				 + "			+ Category ranged: []\n"
				 + "		+ Filter: #1\n"
				 + "			+ Filtered property: 1.0\n"
				 + "			+ Combine method: 1 (Relative: nearest)\n"
				 + "\n"
				 + "Behavior Group #2\n"
				 + "Extracted property: 1.0 (Position)\n"
				 + "   + Behavior #0\n"
				 + "	*** Activation\n"
				 + "		+ Activation property: 0.0\n"
				 + "		+ LowerRange: 0.0\n"
				 + "		+ UpperRange: 0.0\n"
				 + "		+ Check Set: []\n"
				 + "		+ Option: 0 _ Always activated\n"
				 + "		+ Weight: 50.0\n"
				 + "		+ AF type: 0 Default\n"
				 + "	*** Action\n"
				 + "		+ Option: 2 (Self space)\n"
				 + "		+ Offset: 0.0\n"
				 + "		+ Act_on_empty_segment: 1\n"
				 + "		+ Segment_com_filter: 1.0\n"
				 + "		+ Segment_distance_filter: 1";
				
		ArrayList<BehaviorGroup> preset_behavior_Group = addModelFromText(s_preset);
		
		ArrayList<BehaviorGroup> behavior_Group = addModelFromText(s_set);
		
		/*
		//Test if the convertation between model data structure to text structure are the same or not.
		 * 
		Model testing_model = new Model(behavior_Group,preset_behavior_Group);
		
		File folder_name = new File("testing_model");
		
		folder_name.mkdir();
		
		printFile(testing_model, 0, "testing_model", folder_name, 0);
		*/
		//ArrayList<BehaviorGroup> behavior_Group = testing();
		
		
		
		//count_CellSpaceSetting();
		
		zones = new ArrayList<Zone>();

		// Add hard code zone here
		ArrayList<Zone> zone_set = setZone();

		for (Zone z : zone_set) 
		{
			zones.add(z);
		}
		
		addConstraint();
		
		if (global_var.search_Model == false) 
		{
			System.out.println("Run from running model");

			for (int i = 0; i < 1; i++) 
			{
				if (i % 50 == 0)
				{
					System.out.println();
				}
				
				System.out.print(i + " ");
				
				//goals = spatial_set_list.getSpatialSet(0);
				
				goals = setHardcodeGoal();
				
				obstacles = setHardcodeObstacle();
				
				//classify_model_behavior(preset_behavior_Group);
				
				runModel_Simulation(preset_behavior_Group, behavior_Group,0);

				
				// Reset
				models = new ArrayList<Model>();
				// behavior_Group = new ArrayList<BehaviorGroup>();
				filter_chain = new ArrayList<Filter>();
				agents = new ArrayList<Agent>();  
				activation = new Activation();
			}

		}
		else 
		{
			System.out.println("Run from searching model");
			
			//behavior_Group = createRandomBG();
			//BG_set = testing();
			
			// Add hard code goal to entities here
			//goals = spatial_set_list.getSpatialSet(goal_set_index);
			
			goals = setHardcodeGoal();
			
			obstacles = setHardcodeObstacle();
			
			BehaviorTemplate B_template_dummy = new BehaviorTemplate();
			
			B_template =  B_template_dummy.getBehaviortemplate();
			
			searchModel_Simulation(preset_behavior_Group, behavior_Group);
		}
		
		
	}

	static void classify_model_behavior(ArrayList<BehaviorGroup> preset_behavior_Group) throws IOException, InterruptedException
	{
		ArrayList<model_list> model_list_each_generation = new ArrayList<model_list>();
		
		ArrayList<Model> model_database = new ArrayList<Model>();
	
		
		//Creating a File object for directory
		File directoryPath = new File("/Users/haile/Desktop/population");
		//List of all files and directories
		File filesList[] = directoryPath.listFiles();
		
		
		System.out.println("Model analyze:");
		
		ArrayList<String> file_string = new ArrayList<String>();
		
		for (File file: filesList)
		{

			file_string.add(file.getAbsolutePath());
			
		}
		
		Collections.sort(file_string);
		
		//Remove a .DS_store file, always at the beginning
		file_string.remove(0);
		
		//This is the last model when GA is done
		//After sort, it stays at the beginning
		//We want to move it to the end
		String final_model_path = file_string.get(0);
		
		//Remove the final mode 
		file_string.remove(0);
		//Add it to the end
		file_string.add(final_model_path);
		
		for(String file : file_string) 
		{
			//System.out.println("File path: "+ file.getAbsolutePath());
			
			String string_raw = readFile(file);
			
			String model_text[] = string_raw.split("----------------------------------aaaaaaaaaaaaaaaaaa----------------------------------");
			
			int count = 0;
			
			model_database = new ArrayList<Model>();
			
			for (String s : model_text)
			{
				String BG_string[] = s.split("Sum is average between " + Main.global_var.simulation_per_generation + " simulations of each model");
				
				//Not care about random model.
				if (count >= 1)
				{
					ArrayList<BehaviorGroup> behavior_Group = addModelFromText(BG_string[0]);
					
					//ArrayList<BehaviorGroup> preset_behavior_Group = addModelFromText(BG_string[0]);
					
					Model m = new Model(behavior_Group);
					
					
					String s1[] = BG_string[0].split(":");
					
					String fitnessScore_str[] = s1[1].split("I");
					
					double fitnessScore = Double.valueOf(fitnessScore_str[0]);
					
					
					m.fitnessMetric = fitnessScore;
					
					m.model_name_file = file;
					
					
					//Only add good model here
					if (fitnessScore > 0.07)
					{
						model_database.add(m);
					}
					
				}
				
				count++;
			}
			
			model_list_each_generation.add(new model_list(model_database));
		}
	         
		
		model_list model_list = new model_list();
		
		
		//Classify behaviors' functions here -> which behavior makes a certain fitness function high.
		model_list.classify_behavior_purpose(model_list_each_generation);
		
		//model_list.analyzeModel_listTemplate(model_list_each_generation);
		
		//Store model specification to model data structure 
		//Should have  model structure list for each behavior goal category
		
	
		
		
		//model_database stores all models from a directory
		// Analyze the data structure now
		
		modelAnalyze ma = new modelAnalyze(model_database);
		
		//Classify model score
		//ma.classifyScore();
		
		/*
		double low = 0.25;
		double high = 0.4;
		//Count number of BG in each
		//ma.classifyBehaviorGroup(low,high);
		
		//Count number of B in each model
		//ma.classifyBehavior(low,high);
		
		//ma.countPropertyUsed(low, high);
		//ma.countFolowingBehavior(low, high);
		
		//ma.countTurnLRBehavior(low, high);
		
		//ma.simplifyModel(low, high);
		
		for (Model m: model_database)
		{
			System.out.println("Path name: " + m.model_name_file);
			

			for (int i = 0; i < 1000; i++) 
			{
				System.out.print(i + " ");
				
				if (i%50 == 0)
					System.out.println();
				//goals = spatial_set_list.getSpatialSet(0);
				
				goals = setHardcodeGoal();
				
				obstacles = setHardcodeObstacle();
				
				runModel_Simulation(preset_behavior_Group, m.behavior_Group,0);

				// Reset
				models = new ArrayList<Model>();
				// behavior_Group = new ArrayList<BehaviorGroup>();
				filter_chain = new ArrayList<Filter>();
				agents = new ArrayList<Agent>();
				activation = new Activation();
			}
			
			double ave_finish_time = 0;
			double ave_agent_remain = 0;
			double ave_collision = 0;
			
			for (int j = 0; j < finish_time_list.size(); j++)
			{
				ave_finish_time += finish_time_list.get(j);
				ave_agent_remain += agent_remain_list.get(j);
				ave_collision += collision_list.get(j);
			}
			
			System.out.println("\n"+ave_finish_time/finish_time_list.size());
			System.out.println(ave_agent_remain/agent_remain_list.size());
			System.out.println(ave_collision/collision_list.size());
			
			finish_time_list.clear();
			agent_remain_list.clear();
			collision_list.clear();
		}
		*/
		
		System.out.println("Done");
	}
	
	
	
	
	static void runModel_Simulation(ArrayList<BehaviorGroup> preset_behavior_Group, ArrayList<BehaviorGroup> behavior_Group, int test_case) throws InterruptedException 
	{
		ArrayList<Double> fitness1 = new ArrayList<Double>();
		ArrayList<Double> fitness2 = new ArrayList<Double>();
		ArrayList<Double> fitness3 = new ArrayList<Double>();
		
		for (int i = 0; i < 10; i++) 
		{
			System.out.println(i);
			Model a_model = null;

			// The source is used to generate agents
			ArrayList<agentGenerator> a_gen = setAgentGenerator();

			for (agentGenerator a_g : a_gen) 
			{
				a_generator.add(a_g);
			}

			ArrayList<ArrayList<Entity>> entity_list = createEntityList(1);
			
			for (Entity e: entity_list.get(0))
			{
				if (e instanceof Agent)
				{
					((Agent) e).addBehavior(behavior_Group);
				}
			}
			
			a_model = new Model(entities, zones, a_generator, behavior_Group, preset_behavior_Group);
		
			
			a_model.runSimulation(global_var.num_generation,test_case);
			
			finish_time_list.add(a_model.finish_time_test);
			agent_remain_list.add(a_model.agent_remain_test);
			collision_list.add(a_model.collision_fitnessScore);
			finish_time_list.add(a_model.follow_leader_fitnessScore);
			fitness1.add(a_model.follow_leader_fitnessScore);
			fitness2.add(a_model.obstacleAvoidance_fitnessScore);
			fitness3.add(a_model.personalSpace_fitnessScore);
			
			//System.out.println("Finish time: " + a_model.finish_time_test);
			//System.out.println("Agent remain: " + a_model.agent_remain_test);
			
			models.add(a_model);
		}

		double fitness1_ave = 0;
		double fitness2_ave = 0;
		double fitness3_ave = 0;
		
		for (Double d: fitness1)
		{
			fitness1_ave += d;
			System.out.println(d);
		}
		
		System.out.println("Leader following ave: " + fitness1_ave/fitness1.size());
		
		
		for (Double d: fitness2)
		{
			fitness2_ave += d;
			System.out.println(d);
		}
		System.out.println("Obs avoidance: ave" + fitness2_ave/fitness2.size());
		
		
		for (Double d: fitness3)
		{
			fitness3_ave += d;
			System.out.println(d);
		}
		System.out.println("Personal space: " + fitness3_ave/fitness3.size());
		
		// MainGUI mainGUI = new MainGUI(models.get(0));

	}

	static void searchModel_Simulation(ArrayList<BehaviorGroup> BG_preset, ArrayList<BehaviorGroup> BG_set) throws IOException, InterruptedException 
	{

		GeneticAlgorithm GA_models = null;

		// Desired model at the end
		ArrayList<Model> final_models = null;

		int best_model_generation = 0;
		// The source is used to generate agents
		ArrayList<agentGenerator> a_gen = setAgentGenerator();

		for (agentGenerator a_g : a_gen) 
		{
			a_generator.add(a_g);
		}
		
		Random rand = new Random();

		int cal = rand.nextInt(1000000);
		String folder_name_string = String.format("%1$sA-%2$sM-%3$sG-%4$sn.txt", global_var.num_of_agents, global_var.num_model,
				global_var.num_generation, cal);
		
		File folder_name = new File(folder_name_string);
		folder_name.mkdir();
		
		boolean terminated = false;
		
		for (int i = 0; i < global_var.num_generation; i++) 
		{
			// Create various models with the same initial set up and random behaviors
			// When searching for models
			// Each model needs to test more than 1 time to rule out the luck (run well only
			// with specific set up)
			// Each simulation in each generation will have the same initial set up
			// This list stores sets of initial set up
			
			ArrayList<ArrayList<Entity>> entity_list = createEntityList(global_var.simulation_per_generation);
			
			// For the very first generation
			// Random model is generated
            if (i == 0) 
			{
				for (int j = 0; j < global_var.num_model; j++) 
				{
					System.out.print(j + " ");

					if (j % 50 == 0) {
						System.out.println();
					}
					// ArrayList<Agent> agents_local = new ArrayList<Agent>();
					double sum = 0;
					
					//Debug purpose only
					String s_set = "Behavior Group #0\n"
							+ "Extracted property: 1.0 (Position)\n"
							+ "   + Behavior #0\n"
							+ "	*** Activation\n"
							+ "		+ Activation property: 0.0\n"
							+ "		+ LowerRange: 0.0\n"
							+ "		+ UpperRange: 0.0\n"
							+ "		+ Check Set: []\n"
							+ "		+ Option: 0 _ Always activated\n"
							+ "		+ Weight: 1.0\n"
							+ "		+ AF type: 0 Default\n"
							+ "	*** Action\n"
							+ "		+ Option: 2 (Self space)\n"
							+ "		+ Offset: 0.0\n"
							+ "		+ Act_on_empty_segment: 1\n"
							+ "		+ Segment_com_filter: 1.0\n"
							+ "		+ Segment_distance_filter: 1\n"
							+ "		+ Filter: #0\n"
							+ "			+ Filtered property: 3.0\n"
							+ "			+ Numeritc ranged: [0.0 , 60.0]\n"
							+ "			+ Category ranged: []"
							   
							  
							 ;
					
					//BG_preset = addModelFromText(s_preset);
					//Get the behavior template set here
					//BG_set =  addModelFromText(s_set);
					BG_set = createRandomBG();
					
					//BG_set = createModelFromCandidate();
					Model a_model = new Model(BG_set);
					
					a_model.fitnessMetric = getFitnessScore(a_model, entity_list, BG_set, BG_preset, Main.global_var.simulation_per_generation);
					
				
					// average the sum before adding to the population
					//a_model.fitnessMetric = sum / global_var.simulation_per_generation;

					models.add(a_model);

				}

				// Sort models base on fitnessMetric
				Collections.sort(models, new SortbyFitnessMetric());
					
				//Save the best model in discover, regardless its generations
				best_model = models.get(0);
				
				GA_models = new GeneticAlgorithm(models);
			}
			// After having generation 0th evaluate and sorted
			// GA begins
			else 
			{
				//// Working on GA operators - selection/crossover/mutation
				ArrayList<Model> new_generation = GA_models.runGA(entity_list, i);

				double sum = 0;

				int count = 0;
				// Evaluate the new_generation
				for (Model m : new_generation) 
				{
					System.out.print(count + " ");
					count++;
					
					if (count % 50 == 0) 
					{
						System.out.println();
					}
					
					m.fitnessMetric = getFitnessScore(m, entity_list, m.behavior_Group, m.preset_behavior_Group, Main.global_var.simulation_per_generation);
				
					
				}

				Collections.sort(new_generation, new SortbyFitnessMetric());
				
				
				if (new_generation.get(0).fitnessMetric > best_model.fitnessMetric)
				{
					best_model = GA_models.deepCopy_Model(new_generation.get(0));
					best_model.fitnessMetric = new_generation.get(0).fitnessMetric;
					best_model_generation = i;
				}
				
				System.out.println(
						"----------------------------------*******************----------------------------------");
				System.out.println("Generation #" + i + " :" + new_generation.get(0).fitnessMetric);
				// System.out.println("Snake before #" + i + " :" +
				// new_generation.get(0).snakeBefore);
				System.out.println("Snake :" + new_generation.get(0).snakeShape_fitnessScore);
				System.out.println("Obstacle :" + new_generation.get(0).obstacleAvoidance_fitnessScore);
				System.out.println("PersonaS :" + new_generation.get(0).personalSpace_fitnessScore);
				System.out.println("Circle :" + new_generation.get(0).CircleShapeMetric_fitnessScore);
				System.out.println("Speed :" + new_generation.get(0).speedMetric_fitnessScore);
				System.out.println("InsideZ :" + new_generation.get(0).insideDestinationZone_fitnessScore);
				System.out.println("Follow leader :" + new_generation.get(0).follow_leader_fitnessScore);
				System.out.println("Done");

				fitness_score_tracker.add(new fitness_score_list(new_generation.get(0).fitnessMetric,
						new_generation.get(0).snakeShape_fitnessScore,
						new_generation.get(0).obstacleAvoidance_fitnessScore,
						new_generation.get(0).personalSpace_fitnessScore,
						new_generation.get(0).speedMetric_fitnessScore,
						new_generation.get(0).CircleShapeMetric_fitnessScore,
						new_generation.get(0).insideDestinationZone_fitnessScore,
						new_generation.get(0).collision_fitnessScore,
						new_generation.get(0).finish_time_fitnessScore,
						new_generation.get(0).follow_leader_fitnessScore,
						new_generation.get(0).exceed_AngleTurn_fitnessScore,
						new_generation.get(0).surround_leader_fitnessScore,
						GA_models.success_crossover, GA_models.success_mutate));

				printInfo(new_generation.get(0), i);

				//Print 40 best models in each generation
				for (int j = 0; j < global_var.num_model; j++) 
				{
					// Create a filename from a format string.
					// printInfo(final_models.get(i),i);
					String file_name = "generation " + i;
					printFile(new_generation.get(j), j, file_name, folder_name, best_model_generation);
				}
				
				if (new_generation.get(0).fitnessMetric >= global_var.stop_score) 
				{
					System.out.println("Hit the best model");
					final_models = new_generation;
					break;
				}

				//meaning it runs for 20 generations and the result is still not very great
				if (new_generation.get(0).fitnessMetric <= 0.3 && i == 40)
				{
					System.out.println("This generation is not good, terminated");
					final_models = new_generation;
					terminated = true;
					break;
				}
				
				// if the final generation still cannot get the desired fitness metric
				if (i == global_var.num_generation - 1) 
				{
					System.out.println("Hit the end of computational limit");
					final_models = new_generation;
					break;
				}

				// new_generation after this step become old population for next GA generation
				GA_models = new GeneticAlgorithm(new_generation);
			}

		}

		String file_name = String.format("%1$sS-%2$sA-%3$sM-%4$sG-%5$sn.txt", final_models.get(0).fitnessMetric, global_var.num_of_agents, global_var.num_model,
				global_var.num_generation, cal);
		// printFile(model_tracker, result);
		
		if (terminated == true)
		{
			file_name = String.format("Terminated%1$sS-%2$sA-%3$sM-%4$sG-%5$sn.txt", final_models.get(0).fitnessMetric, global_var.num_of_agents, global_var.num_model,
					global_var.num_generation, cal);
		}
		
		//Add the best model in the first index
		final_models.add(0, best_model);
		
		for (int i = 0; i < global_var.num_model; i++) 
		{
			// Create a filename from a format string.
			// printInfo(final_models.get(i),i);
			printFile(final_models.get(i), i, file_name, folder_name, best_model_generation);
		}

		//Rename the folder file so that the best 
		File rename = new File(file_name);
		
		folder_name.renameTo(rename);
		
		System.out.println("Completed");
	}

	
	
	static public ArrayList<agentGenerator> setAgentGenerator() 
	{
		ArrayList<agentGenerator> a_gen = new ArrayList<agentGenerator>();
		
		
		int rate = 10;

		// 30,80
		//For fix zone 70 105 135
		//Remember to remove random in agentGenerator as well.
		
		int position = 60;
		int space = 22;
		int shift = 5;
		
		agentGenerator gen1_1 = new agentGenerator(new Position(35, 35), 0, 2, 1.0, rate);

		a_gen.add(gen1_1);

		return a_gen;
	}

	static public ArrayList<BehaviorGroup> createRandomBG() 
	{

		// Adding random behavior here
		ArrayList<Double> BG_extract_p_option = new ArrayList<Double>();

		ArrayList<BehaviorGroup> BG_set = new ArrayList<BehaviorGroup>();

		Random rand = new Random();

		/*
		 * for (double d : global_var.properties) { BG_extract_p_option.add(d); }
		 */

		// Type and zone property for now does not have extracted feature
		// Eliminate them from the search space for BG only

		int random_num_behavior = rand.nextInt(global_var.max_behavior) + 1;

		
		//Random shuffle behavior template list
		Collections.shuffle(B_template);

		//Hardcode behavior here
		//Choosing a speed behavior
		/*
		int offset = rand.nextInt(3);
		if (offset == 0)
		{
			offset = -1;
		}
		else if (offset == 1)
		{
			offset = 0;
		}
		else if (offset == 2)
		{
			offset = 1;
		}
		*/
		
		/*
		//After adding a set of random at max 3 behaviors
		//The model always have 3 space behavior
		double extract_p = 2.0;
		
		//Space behavior, now have one more parameter for distance_option;
		//0: distance to desired direction
		//1: travel distance
		//2: distance to current direction
		
		//Distance option
		//0: nearest
		//1: farthest
		
		// Create a new behavior group with extraction property
		//0: distance to desired direction
		BehaviorGroup space_BG = new BehaviorGroup(extract_p);
				
		BehaviorTemplate chosen_B_template = new BehaviorTemplate("space0", 2, 0, rand.nextInt(2), 0);
		
		Behavior B1 = new Behavior(chosen_B_template, extract_p);
		
		space_BG.behavior_set.add(B1);
		
		//1: travel distance
		chosen_B_template = new BehaviorTemplate("space1", 2, 1, rand.nextInt(2), 0);
		
		Behavior B2 = new Behavior(chosen_B_template, extract_p);
		
		space_BG.behavior_set.add(B2);
		
		//2: distance to current direction
		chosen_B_template = new BehaviorTemplate("space2", 2, 2, rand.nextInt(2), 0);
		
		Behavior B3 = new Behavior(chosen_B_template, extract_p);
		
		space_BG.behavior_set.add(B3);
		
		BG_set.add(space_BG);
		*/
		
		for (int i = 0; i < random_num_behavior; i++)
		{
			
			Collections.shuffle(B_template);
			BehaviorTemplate chosen_B_template = B_template.get(i);
			
			double extract_p = chosen_B_template.extract_property;

			if (extract_p == 0)
			{
				System.out.println("Check Main.java");
			}
			
			if (BG_set.size() == 0)
			{
				// Create a new behavior group with extraction property
				BehaviorGroup a_BG = new BehaviorGroup(extract_p);

				// Create a random behavior
				Behavior B = new Behavior(chosen_B_template, extract_p);

				a_BG.behavior_set.add(B);

				BG_set.add(a_BG);
			}
			else
			{
				ArrayList<Double> extracted_property_used = new ArrayList<Double>();
				
				for (Double d: searchSpace.properties)
				{
					extracted_property_used.add(d);
				}


				boolean add_B = false;
				//Check if the BG already exist
				for (BehaviorGroup BG : BG_set)
				{
					extracted_property_used.removeIf(n -> n == BG.extracted_p);


					if( BG.extracted_p == chosen_B_template.extract_property)
					{
						add_B = true;

						// Create a random behavior
						Behavior B = new Behavior(chosen_B_template, BG.extracted_p);
						
						BG.behavior_set.add(B);
					}
				}

				//Means that there still one extracted property left
				if (extracted_property_used.size() != 0 && add_B == false)
				{
					// Create a new behavior group with extraction property
					BehaviorGroup a_BG = new BehaviorGroup(extract_p);

					// Create a random behavior
					Behavior B = new Behavior(chosen_B_template, extract_p);

					a_BG.behavior_set.add(B);

					BG_set.add(a_BG);
				}
			}		
		}
		
		return BG_set;

	}

	static public ArrayList<BehaviorGroup> createModelFromCandidate() throws IOException
	{
		
		Random rand = new Random();
		rawText rawText = new rawText();
		
		//Can put these model arrayList into another arrayList (2D arrayList) to make a better code
		// ->However, it will make it more difficult to remember the which index belongs to which category
		ArrayList<Model> obstacle_avoidance_model_list = utility.convertFromTextTo_Model_DataStructure(rawText.obstacle_avoidance_B_test);
		ArrayList<Model> follow_leader_model_list = utility.convertFromTextTo_Model_DataStructure(rawText.follow_leader_behavior);;
		ArrayList<Model> controlAngleTurn_model_list = utility.convertFromTextTo_Model_DataStructure(rawText.controlAngleTurn_behavior);;
		ArrayList<Model> personalSpace_model_list = utility.convertFromTextTo_Model_DataStructure(rawText.personalSpace_behavior);;
		//ArrayList<Model> speed_model_list = utility.convertFromTextTo_Model_DataStructure(rawText.speed_behavior);;
		
		//This BG_set is a combination between one of each behavior from the candidate above
		ArrayList<BehaviorGroup> BG_set = new ArrayList<BehaviorGroup>();
		
		//Pick one random candidate from the list
		Model obstacle_avoidance_model = obstacle_avoidance_model_list.get(rand.nextInt(obstacle_avoidance_model_list.size()));
		Model follow_leader_model = follow_leader_model_list.get(rand.nextInt(follow_leader_model_list.size()));
		Model controlAngleTurn_model = controlAngleTurn_model_list.get(rand.nextInt(controlAngleTurn_model_list.size()));
		Model personalSpace_model = personalSpace_model_list.get(rand.nextInt(personalSpace_model_list.size()));
		//Model speed_model = speed_model_list.get(rand.nextInt(speed_model_list.size()));
		
		
		//The initial BG_set will have properties in search space pre-installed
		//After picking candidate, we simply put candidate behavior to the appropriate behavior group
		//1.0 is position
		//2.0 is angle
		//3.0 is speed
		for (Double d: searchSpace.properties)
		{
			BG_set.add(new BehaviorGroup(d));
		}
		
		
		for (BehaviorGroup BG: obstacle_avoidance_model.behavior_Group)
		{
			for (Behavior B: BG.behavior_set)
			{
				if (BG.extracted_p == 1.0)
				{
					BG_set.get(0).behavior_set.add(B);
				}
				else if (BG.extracted_p == 2.0)
				{
					BG_set.get(1).behavior_set.add(B);
				}
				else if (BG.extracted_p == 3.0)
				{
					BG_set.get(2).behavior_set.add(B);
				}
			}
			
			
		}
		
		for (BehaviorGroup BG: follow_leader_model.behavior_Group)
		{
			for (Behavior B: BG.behavior_set)
			{
				if (BG.extracted_p == 1.0)
				{
					BG_set.get(0).behavior_set.add(B);
				}
				else if (BG.extracted_p == 2.0)
				{
					BG_set.get(1).behavior_set.add(B);
				}
				else if (BG.extracted_p == 3.0)
				{
					BG_set.get(2).behavior_set.add(B);
				}
			}
			
			
		}
		
		for (BehaviorGroup BG: controlAngleTurn_model.behavior_Group)
		{
			for (Behavior B: BG.behavior_set)
			{
				if (BG.extracted_p == 1.0)
				{
					BG_set.get(0).behavior_set.add(B);
				}
				else if (BG.extracted_p == 2.0)
				{
					BG_set.get(1).behavior_set.add(B);
				}
				else if (BG.extracted_p == 3.0)
				{
					BG_set.get(2).behavior_set.add(B);
				}
			}
			
			
		}
		
		for (BehaviorGroup BG: personalSpace_model.behavior_Group)
		{
			for (Behavior B: BG.behavior_set)
			{
				if (BG.extracted_p == 1.0)
				{
					BG_set.get(0).behavior_set.add(B);
				}
				else if (BG.extracted_p == 2.0)
				{
					BG_set.get(1).behavior_set.add(B);
				}
				else if (BG.extracted_p == 3.0)
				{
					BG_set.get(2).behavior_set.add(B);
				}
			}
		}
		
		/*
		for (BehaviorGroup BG: speed_model.behavior_Group)
		{
			for (Behavior B: BG.behavior_set)
			{
				if (BG.extracted_p == 3.0)
				{
					BG_set.get(2).behavior_set.add(B);
				}
				else
				{
					System.out.println("speed_model should not have position or angle extract property ");
				}
			}
			
			
		}
		*/
		
		
		
		ArrayList<Behavior> speed_behavior_without_dub = new ArrayList<Behavior>();
		GeneticAlgorithm dummy_GA = new GeneticAlgorithm();
		
		//Testing duplicate speed behavior here
		for (int i = 0; i < BG_set.get(2).behavior_set.size(); i++)
		{
			if (i == 0)
			{
				speed_behavior_without_dub.add(BG_set.get(2).behavior_set.get(i));
			}
			else
			{
				boolean duplication = false;
				for (Behavior b: speed_behavior_without_dub)
				{
					if (dummy_GA.isBehaviorEqual(b, BG_set.get(2).behavior_set.get(i)) == true)
					{
						duplication = true;
						break;
					}
				}
				
				if (duplication == false)
				{
					speed_behavior_without_dub.add(BG_set.get(2).behavior_set.get(i));
				}
			}
		}
		
		
		BG_set.get(2).behavior_set.clear();
		
		for (Behavior B : speed_behavior_without_dub)
		{
			BG_set.get(2).behavior_set.add(B);
		}	
		
		//If there is a BG without any B -> remove the BG
		BG_set.removeIf(n -> n.behavior_set.size() == 0);
		
		return BG_set;

	}
	
	
	static public double getFitnessScore(Model m, ArrayList<ArrayList<Entity>> entity_list, ArrayList<BehaviorGroup> BG, ArrayList<BehaviorGroup> preset_BG, int num_of_simulation)
			throws InterruptedException 
	{
		double sum = 0;
		int count_simulation = 0;
		
		ArrayList<Double> temp_list = new ArrayList<Double>();
		// Change initial set up for each simulation per generation
		
		
		for (ArrayList<Entity> at : entity_list)
		{
			//For checking purpose
			double count_agent = 0;
					
			m.entities.clear();
			m.agents.clear();
			m.obstacles.clear();
			m.goals.clear();
			m.zones.clear();
			
			//Need a deep copy
			for (Entity e : at)
			{
				//m.entities.add(e);
				
				if (e instanceof Agent)
				{
					//Deep copy an agent
					Agent a = new Agent((Agent) e);
					//Agent a = (Agent) e;
					//a.addBehavior(BG);
					if (a.type.value == 1.1)
					{
						a.addBehavior(preset_BG);
					}
					else
					{
						a.addBehavior(BG);
					}
					a.addConstraint(constraint_set);
					m.agents.add(a);
					m.entities.add(a);
				}
				else
				{

					if (e instanceof Obstacle_circle)
					{
						Obstacle_circle o = new Obstacle_circle((Obstacle_circle) e);
						m.obstacles.add(o);
						m.entities.add(o);
					}
					else if (e instanceof Obstacle_rectangle)
					{
						Obstacle_rectangle r = new Obstacle_rectangle((Obstacle_rectangle) e);
						m.obstacles.add(r);
						m.entities.add(r);
					}
					else if (e instanceof Goal)
					{
						//Goal point in some application can move (follow leader for example)
						if (e instanceof Goal_point)
						{
							Goal_point g = new Goal_point(( Goal_point)e);
							m.goals.add(g);
							m.entities.add(g);
						}
						//For now, if the goal does not move
						//It is fine to shadow copy them
						else
						{
							Goal g = (Goal) e;
							m.goals.add(g);
							m.entities.add(g);
						}
						
					}
				}
			}
			
			//zones = new ArrayList<Zone>();

			// Add hard code zone here
			ArrayList<Zone> zone_set = setZone();

			for (Zone z : zone_set) 
			{
				m.zones.add(z);
			}
			
			// Need to reset the fitness score except the sum before start a new simulation.
			m.resetFitnessScore();
			m.runSimulation(count_simulation,0);

			count_simulation++;
			
			temp_list.add(m.fitnessMetric);

			// Will need to calculate the sum fitness before adding it to models set
			sum += m.fitnessMetric;
		}
		//Average between all simulation
		sum = sum / num_of_simulation;
				
		//Only choose the best score
		//Collections.sort(temp_list,  Collections.reverseOrder());
		Collections.sort(temp_list);

		//return temp_list.get(0);
		return sum;
	}

	//Accept a list of probability
	//Return which index to pick
	
	public static int getValueBaseOnProbability(ArrayList<Double> list)
	{
		int return_index = 0;
		double sum = 0;
		
		ArrayList<Double> probability_list = new ArrayList<Double>();
		
		//count the sum
		for (Double d : list)
		{
			sum += d;
		}
		
		//Add the probability to a list
		for (Double d: list)
		{
			probability_list.add(d/sum);
		}
		
		Random r = new Random();
		
		//Get a value between 0 and 1
		double random_choice = r.nextDouble();
		
		double partial_sum = 0;
		
		for (Double d: probability_list)
		{
			partial_sum += d;
			
			if (random_choice < partial_sum)
			{
				return return_index;
			}
			else
			{
				return_index++;
			}
		}
		
		return return_index;
	}
	
	public static void printInfo(Model model, int i) 
	{
		System.out.println("Model #: " + i);
		System.out.print("Sum fitness Metric: " + model.fitnessMetric + "\n");
		System.out.print("Fitness SnakeShape: " + model.snakeShape_fitnessScore + "\n");
		System.out.print("CircleShape: " + model.CircleShapeMetric_fitnessScore + "\n");
		System.out.print("Fitness PersonalSpace: " + model.personalSpace_fitnessScore + "\n");
		System.out.print("Fitness Speed: " + model.speedMetric_fitnessScore + "\n");
		System.out.print("Obstacle Avoidance: " + model.obstacleAvoidance_fitnessScore + "\n");
		System.out.print("Inside Pre FIx Zone: " + model.insideDestinationZone_fitnessScore + "\n");
		System.out.print("Collision: " + model.collision_fitnessScore + "\n");
		System.out.print("Finish time " + model.finish_time_fitnessScore + "\n");
		System.out.print("Follow leader: " + model.follow_leader_fitnessScore + "\n");
		
		// System.out.println("dis_ave: " + model.dis_ave);

		for (int j = 0; j < model.agents.get(0).behavior_Group.size(); j++) 
		{
			BehaviorGroup BG = model.agents.get(0).behavior_Group.get(j);
			System.out.println("\nBehavior Group #" + j);

			if (BG.extracted_p == 1) {
				System.out.println("Extracted property: " + BG.extracted_p + " (Position)");
			} else if (BG.extracted_p == 2.0) {
				System.out.println("Extracted property: " + BG.extracted_p + " (Angle)");
			} else if (BG.extracted_p == 2.1) {
				System.out.println("Extracted property: " + BG.extracted_p	
						+ " (Angle difference between heading direction and direction to chosen agent)");
			} else if (BG.extracted_p == 3.0) {
				System.out.println("Extracted property: " + BG.extracted_p + " (Speed)");
			} else if (BG.extracted_p == 4.0) {
				System.out.println("Extracted property: " + BG.extracted_p + " (Type)");
			} else if (BG.extracted_p == 5.0) {
				System.out.println("Extracted property: " + BG.extracted_p + " (Zone)");
			}

			for (int k = 0; k < BG.behavior_set.size(); k++) {
				Behavior B = BG.behavior_set.get(k);

				System.out.println("\t- Behavior #" + k);
				System.out.println("\t*** Activation");

				if (B.activation.option == 0) {
					System.out.println("\t\t- Option: " + B.activation.option + " - Always activated - return weight = 1");
					
				}
				else if (B.activation.checking_value_reference instanceof SelfChecking_Value) 
				{
					System.out.println("\t\t- Option: " + B.activation.option + " - Check self-property");

				} 
				else if (B.activation.checking_value_reference instanceof NeighborChecking_Value) 
				{
					System.out.println("\t\t- Option: " + B.activation.option + " - Check neighbor-property");
	

					//if (B.activation.option == 2)
					NeighborChecking_Value n_c_v = (NeighborChecking_Value) B.activation.checking_value_reference;
					
					System.out.println("\t\t- Null activation: " + n_c_v.null_activation);

					for (int l = 0; l < n_c_v.filter_chain.size(); l++) {
						System.out.println("\t\t- Filter: #" + l);

						Filter F = n_c_v.filter_chain.get(l);

						System.out.println("\t\t\t+ Filtered property: " + F.filtered_p);

						if (F instanceof Filter_ranged) {
							Filter_ranged fr = (Filter_ranged) F;
							System.out.println(
									"\t\t\t+ Numeritc ranged: [" + fr.lowerRange + " , " + fr.upperRange + "]");
							System.out.println("\t\t\t+ Category ranged: " + fr.filtered_set);
						} else if (F instanceof Filter_method) {
							Filter_method fm = (Filter_method) F;
							if (fm.method == 1) {
								System.out.println("\t\t\t+ Combine method: " + fm.method + " (Relative: nearest)");
							} else if (fm.method == 2) {
								System.out.println("\t\t\t+ Combine method: " + fm.method + " (Relative: farthest)");
							} else if (fm.method == 3) {
								System.out.println("\t\t\t+ Combine method: " + fm.method + " (Absolute: max)");
							} else if (fm.method == 4) {
								System.out.println("\t\t\t+ Combine method: " + fm.method + " (Absolute: min)");
							} else if (fm.method == 5) {
								System.out.println("\t\t\t+ Combine method: " + fm.method + " (Absolute: random)");
							}
						}
					}

				}
				System.out.println("\t\t- Activation property: " + B.activation.extracted_p);
				
				//Default activiation - Always active
				if (B.activation.criteria instanceof DefaultCriteria)
				{
					System.out.println("\t\t- LowerRange: 0.0" );
					System.out.println("\t\t- UpperRange: 0.0" );
					System.out.println("\t\t- Check Set: []" );
				}
				else if (B.activation.criteria instanceof RangeCriteria)
				{
					RangeCriteria rc = (RangeCriteria) B.activation.criteria;
					System.out.println("\t\t- LowerRange: " + rc.activation_lowerRange);
					System.out.println("\t\t- UpperRange: " + rc.activation_upperRange);
					System.out.println("\t\t- Check Set: []" );
				}
				else if (B.activation.criteria instanceof CategoryCriteria)
				{
					CategoryCriteria cc = (CategoryCriteria) B.activation.criteria;
					System.out.println("\t\t- LowerRange: 0.0" );
					System.out.println("\t\t- UpperRange: 0.0" );
					System.out.println("\t\t- Check Set: " + cc.check_set);
				}
				else
				{
					System.out.println("ACtivation criteria is not belong to any preset one." );
				}
				

				if (B.activation.activation_function instanceof Activation_function_binary) 
				{
					System.out.println("\t\t- AF type: " + B.activation.activation_function.type + " (Binary AF)");
					Activation_function_binary afb = (Activation_function_binary) B.activation.activation_function;

					System.out.println("\t\t\t- AF inside: " + afb.inside);
					System.out.println("\t\t- Weight: " + afb.weight);
					
				} 
				else if (B.activation.activation_function instanceof Activation_function_linear)
				{
					System.out.println("\t\t- AF type: " + B.activation.activation_function.type + " (Linear AF)");

					Activation_function_linear afb = (Activation_function_linear) B.activation.activation_function;

					System.out.println("\t\t\t+ AF slope: " + afb.slope);
					System.out.println("\t\t\t+ AF increase: " + afb.increase);
				}
				else
				{
					System.out.println("\t\t- Weight: " + B.activation.activation_function.weight);
				}
				
				System.out.println("\t*** Action");
				if (B.action instanceof SelfReference) 
				{
					System.out.println("\t\t- Option: " + B.action.type  + " (Self reference)");
					System.out.println("\t\t- Offset: " + B.action.offset);
				} 
				else if (B.action instanceof NeighborReference) 
				{
					System.out.println("\t\t- Option: " + B.action.type  + " (Neighbor reference)");
					System.out.println("\t\t- Offset: " + B.action.offset);
				}
				else if (B.action instanceof SpaceReference_Expand) 
				{
					SpaceReference_Expand s_r = (SpaceReference_Expand) B.action;
					System.out.println("\t\t- Option: " + B.action.type  + " (Self space)");
					System.out.println("\t\t- Offset: " + B.action.offset);
					System.out.println("\t\t- Act on empty segment: " + s_r.act_on_empty_space);
					System.out.println("\t\t- Segment combination filter: " + s_r.act_on_space_property);
					System.out.println("\t\t- Segment distance filter: " + s_r.heading_option_combination);
					
				}

				if (B.action instanceof NeighborReference)
				{
					NeighborReference n_r = (NeighborReference) B.action;
					
					for (int l = 0; l < n_r.filter_chain.size(); l++) {
						System.out.println("\t\t- Filter: #" + l);

						Filter F = n_r.filter_chain.get(l);

						System.out.println("\t\t\t+ Filtered property: " + F.filtered_p);

						if (F instanceof Filter_ranged) {
							Filter_ranged fr = (Filter_ranged) F;
							System.out.println("\t\t\t+ Numeritc ranged: [" + fr.lowerRange + " , " + fr.upperRange + "]");
							System.out.println("\t\t\t+ Category ranged: " + fr.filtered_set);
						} else if (F instanceof Filter_method) {
							Filter_method fm = (Filter_method) F;
							if (fm.method == 1) {
								System.out.println("\t\t\t+ Combine method: " + fm.method + " (Relative: nearest)");
							} else if (fm.method == 2) {
								System.out.println("\t\t\t+ Combine method: " + fm.method + " (Relative: farthest)");
							} else if (fm.method == 3) {
								System.out.println("\t\t\t+ Combine method: " + fm.method + " (Absolute: max)");
							} else if (fm.method == 4) {
								System.out.println("\t\t\t+ Combine method: " + fm.method + " (Absolute: min)");
							} else if (fm.method == 5) {
								System.out.println("\t\t\t+ Combine method: " + fm.method + " (Absolute: random)");
							}
						}
					}
				}
				
			}
		}
	}

	public static void printFile(Model model, int i, String result, File folder_name, int best_model_gen) throws IOException 
	{

		// Get a Calendar and set it to the current time.
		// Calendar cal = Calendar.getInstance();
		// cal.setTime(Date.from(Instant.now()));
		// String result =
		// String.format("%2$sA-%3$sM-%4$sG-file-%1$tY-%1$tm-%1$td-%1$tk-%1$tS-%1$tp.txt",
		// cal, global_var.total_agents, global_var.num_model,
		// global_var.num_generation);

		// ... Apply date formatting codes.		
		File file = new File(folder_name,result);
		FileWriter fr = new FileWriter(file, true);
		BufferedWriter br = new BufferedWriter(fr);

		if (model.sumFitness >= global_var.stop_score) 
		{
			br.write("Fitness score is pass the threshold" + "\n");
		}

		br.write("Sum is average between " + global_var.simulation_per_generation + " simulations of each model\n");
		br.write("Best model at generation: " + best_model_gen + "\n");
		br.write("Agent specification: \n");
		br.write("FOV: Distance - " + global_var.fov_distance + " Angle - " + global_var.fov_angle + "\n");
		
		if (i == 0) 
		{
			br.write("Product Fitness\n");
			for (fitness_score_list d : fitness_score_tracker) {
				br.write(d.fitnessMetric + "\n");
			}

			/*
			 * br.write("Snake Fitness\n"); for (fitness_score_list d :
			 * fitness_score_tracker) { br.write(d.snakeShape_fitnessScore + "\n"); }
			 */

			
			br.write("Obs avoidance Fitness\n");
			for (fitness_score_list d : fitness_score_tracker) {
				br.write(d.obstacleAvoidance_fitnessScore + "\n");
			}
			
			
			br.write("Personal space\n");
			for (fitness_score_list d : fitness_score_tracker) {
				br.write(d.personalSpace_fitnessScore + "\n");
			}
			 
			
			br.write("Inside Des Fitness\n");
			for (fitness_score_list d : fitness_score_tracker) {
				br.write(d.insideDestinationZone_fitnessScore + "\n");
			}
			
			br.write("Finish time fitness\n");
			for (fitness_score_list d : fitness_score_tracker) 
			{
				br.write(d.finish_time_fitnessScore + "\n");
			}
			
			
			br.write("Follow leader fitness\n");
			for (fitness_score_list d : fitness_score_tracker) 
			{
				br.write(d.follow_leader_fitnessScore + "\n");
			}
			
			
			/*
			br.write("Zone Distribution Fitness\n");
			for (fitness_score_list d : fitness_score_tracker) {
				br.write(d.zoneDistribution_fitnessScore + "\n");
			}
			*/
			
			
			/*
			br.write("Circle Fitness\n"); 
			for (fitness_score_list d :fitness_score_tracker)
			{ 
				br.write(d.CircleShapeMetric_fitnessScore + "\n"); 
			}
			 */
			
			
			br.write("Surround leader Fitness\n");
			for (fitness_score_list d : fitness_score_tracker) {
				br.write(d.surround_leader_fitnessScore + "\n");
			}
			
			
			br.write("Exceed angle turn Fitness\n");
			for (fitness_score_list d : fitness_score_tracker) {
				br.write(d.exceed_AngleTurn_fitnessScore + "\n");
			}
			
			br.write("Crossover sucessfully \n");
			for (fitness_score_list d : fitness_score_tracker) 
			{
				br.write(d.sucess_crossover + "\n");
			}
			
			br.write("Mutation successfully \n");
			for (fitness_score_list d : fitness_score_tracker) 
			{
				br.write(d.sucess_mutation + "\n");
			}
		}

		br.write("----------------------------------aaaaaaaaaaaaaaaaaa----------------------------------\n");
		br.write("Generation #" + i + " :" + model.fitnessMetric + "\n");
		//br.write("Snake #" + i + " :" + model.snakeShape_fitnessScore + "\n");
		//br.write("Obstacle#" + i + " :" + model.obstacleAvoidance_fitnessScore + "\n");
		//br.write("PersonaS#" + i + " :" + model.personalSpace_fitnessScore + "\n");
		//br.write("Circle #" + i + " :" + model.CircleShapeMetric_fitnessScore + "\n");
		//br.write("Speed #" + i + " :" + model.speedMetric_fitnessScore + "\n");
		br.write("Inside #" + i + " :" + model.insideDestinationZone_fitnessScore + "\n");
		//br.write("ZoneDistribution #" + i + " :" + model.zoneDistribution_fitnessScore + "\n");
		//br.write("AngleChange #" + i + " :" + model.angleChange + "\n");
		br.write("Finish time #" + i + " :" + model.finish_time_fitnessScore + "\n");

		for (int j = 0; j < model.behavior_Group.size(); j++) 
		{
			BehaviorGroup BG = model.behavior_Group.get(j);
			br.write("\nBehavior Group #" + j + "\n");

			if (BG.extracted_p == 1) 
			{
				br.write("Extracted property: " + BG.extracted_p + " (Position)" + "\n");
			} else if (BG.extracted_p == 2.0) {
				br.write("Extracted property: " + BG.extracted_p + " (Angle)" + "\n");
			} else if (BG.extracted_p == 2.1) {
				br.write("Extracted property: " + BG.extracted_p
						+ " (Angle difference between heading direction and direction to chosen agent)" + "\n");
			} else if (BG.extracted_p == 3.0) {
				br.write("Extracted property: " + BG.extracted_p + " (Speed)" + "\n");
			} else if (BG.extracted_p == 4.0) {
				br.write("Extracted property: " + BG.extracted_p + " (Type)" + "\n");
			} else if (BG.extracted_p == 5.0) {
				br.write("Extracted property: " + BG.extracted_p + " (Zone)" + "\n");
			}

			for (int k = 0; k < BG.behavior_set.size(); k++) 
			{
				Behavior B = BG.behavior_set.get(k);

				br.write("   + Behavior #" + k + "\n");
				br.write("\t*** Activation" + "\n");
				br.write("\t\t+ Activation property: " + B.activation.extracted_p + "\n");
			
				//Default activiation - Always active
				if (B.activation.criteria instanceof DefaultCriteria)
				{
					br.write("\t\t+ LowerRange: 0.0" + "\n" );
					br.write("\t\t+ UpperRange: 0.0" + "\n" );
					br.write("\t\t+ Check Set: []" + "\n" );
				}
				else if (B.activation.criteria instanceof RangeCriteria)
				{
					RangeCriteria rc = (RangeCriteria) B.activation.criteria;
					br.write("\t\t+ LowerRange: " + rc.activation_lowerRange + "\n" );
					br.write("\t\t+ UpperRange: " + rc.activation_upperRange + "\n" );
					br.write("\t\t+ Check Set: []" + "\n" );
				}
				else if (B.activation.criteria instanceof CategoryCriteria)
				{
					CategoryCriteria cc = (CategoryCriteria) B.activation.criteria;
					br.write("\t\t+ LowerRange: 0.0" + "\n" );
					br.write("\t\t+ UpperRange: 0.0" + "\n" );
					br.write("\t\t+ Check Set: " + cc.check_set+ "\n" );
				}
				else
				{
					System.out.println("Activation criteri is not belong to any preset one. Check activation criteria. ");
				}
				
				if (B.activation.option == 0) 
				{
					br.write("\t\t+ Option: " + B.activation.option + " _ Always activated" + "\n");
					br.write("\t\t+ Weight: " + B.activation.activation_function.weight + "\n");
				} 
				else if (B.activation.checking_value_reference instanceof SelfChecking_Value) 
				{
					br.write("\t\t+ Option: " + B.activation.option + " _ Check self_property" + "\n");
				} 
				else if (B.activation.checking_value_reference instanceof NeighborChecking_Value) 
				{
					br.write("\t\t+ Option: " + B.activation.option + " _ Check neighbor_property " + "\n");
				}
				else if (B.activation.checking_value_reference instanceof SpaceChecking_Value)
				{
					SpaceChecking_Value space_checking_action = (SpaceChecking_Value) B.activation.checking_value_reference;
					
					SpaceReference_Expand s_r = (SpaceReference_Expand) space_checking_action.action_for_activation;
					br.write("\t\t+ Option: " + B.activation.option  + " _ Check space_property" + "\n");
				}
				
				if (B.activation.activation_function instanceof Activation_function_binary) 
				{
					br.write("\t\t+ AF type: " + B.activation.activation_function.type + " (Binary AF)" + "\n");
					
					Activation_function_binary afb = (Activation_function_binary) B.activation.activation_function;
				
					br.write("\t\t\t+ AF inside: " + afb.inside + "\n");
					br.write("\t\t\t+ Weight: " + afb.weight + "\n");
				} 
				else if 
				(
					B.activation.activation_function instanceof Activation_function_linear) 
				{
					br.write("\t\t+ AF type: " + B.activation.activation_function.type + " (Linear AF)" + "\n");

					Activation_function_linear afl = (Activation_function_linear) B.activation.activation_function;

					br.write("\t\t\t+ AF slope: " + afl.slope + "\n");
					br.write("\t\t\t+ AF increase: " + afl.increase + "\n");
				} 
				else 
				{
					br.write("\t\t+ AF type: " + B.activation.activation_function.type + " Default" + "\n");
				}
				
				
				
				if (B.activation.checking_value_reference instanceof NeighborChecking_Value)
				{
					NeighborChecking_Value n_c_v = (NeighborChecking_Value) B.activation.checking_value_reference;
					
					br.write("\t\t+ Null activation: " + n_c_v.null_activation + "\n");

					for (int l = 0; l < n_c_v.filter_chain.size(); l++) {
						br.write("\t\t+ Filter: #" + l + "\n");

						Filter F = n_c_v.filter_chain.get(l);

						br.write("\t\t\t+ Filtered property: " + F.filtered_p + "\n");

						if (F instanceof Filter_ranged) {
							Filter_ranged frange = (Filter_ranged) F;
							br.write("\t\t\t+ Numeritc ranged: [" + frange.lowerRange + " , " + frange.upperRange + "]"
									+ "\n");
							br.write("\t\t\t+ Category ranged: " + frange.filtered_set + "\n");
						} else if (F instanceof Filter_method) {
							Filter_method fm = (Filter_method) F;
							if (fm.method == 1) {
								br.write("\t\t\t+ Combine method: " + fm.method + " (Relative: nearest)" + "\n");
							} else if (fm.method == 2) {
								br.write("\t\t\t+ Combine method: " + fm.method + " (Relative: farthest)" + "\n");
							} else if (fm.method == 3) {
								br.write("\t\t\t+ Combine method: " + fm.method + " (Absolute: max)" + "\n");
							} else if (fm.method == 4) {
								br.write("\t\t\t+ Combine method: " + fm.method + " (Absolute: min)" + "\n");
							} else if (fm.method == 5) {
								br.write("\t\t\t+ Combine method: " + fm.method + " (Absolute: random)" + "\n");
							}
						}
					}
				}
				else if (B.activation.checking_value_reference instanceof SpaceChecking_Value)
				{
					SpaceChecking_Value n_c_v = (SpaceChecking_Value) B.activation.checking_value_reference;
					
					br.write("\t\t+ Null activation: " + n_c_v.null_activation + "\n");


					//SpaceReference_Expand s_r = (SpaceReference_Expand) n_c_v.action_for_activation;
					SpaceReference_Static s_r = (SpaceReference_Static) n_c_v.action_for_activation_static;
					
					br.write("\t\t+ Act on empty segment: " + s_r.act_on_empty_space + "\n");
					br.write("\t\t+ Segment com filter: " + s_r.act_on_space_property + "\n");
					br.write("\t\t+ Segment distance filter: " + s_r.heading_option_combination + "\n");

					
					for (int l = 0; l < n_c_v.action_for_activation_static.filter_chain.size(); l++) 
					{
						br.write("\t\t+ Filter: #" + l + "\n");

						Filter F = n_c_v.action_for_activation_static.filter_chain.get(l);

						br.write("\t\t\t+ Filtered property: " + F.filtered_p + "\n");

						if (F instanceof Filter_ranged) {
							Filter_ranged frange = (Filter_ranged) F;
							br.write("\t\t\t+ Numeritc ranged: [" + frange.lowerRange + " , " + frange.upperRange + "]"
									+ "\n");
							br.write("\t\t\t+ Category ranged: " + frange.filtered_set + "\n");
						} else if (F instanceof Filter_method) {
							Filter_method fm = (Filter_method) F;
							if (fm.method == 1) {
								br.write("\t\t\t+ Combine method: " + fm.method + " (Relative: nearest)" + "\n");
							} else if (fm.method == 2) {
								br.write("\t\t\t+ Combine method: " + fm.method + " (Relative: farthest)" + "\n");
							} else if (fm.method == 3) {
								br.write("\t\t\t+ Combine method: " + fm.method + " (Absolute: max)" + "\n");
							} else if (fm.method == 4) {
								br.write("\t\t\t+ Combine method: " + fm.method + " (Absolute: min)" + "\n");
							} else if (fm.method == 5) {
								br.write("\t\t\t+ Combine method: " + fm.method + " (Absolute: random)" + "\n");
							}
						}
					}
				}
				br.write("\t*** Action" + "\n");
				if (B.action instanceof SelfReference) 
				{
					br.write("\t\t+ Option: " + B.action.type  + " (Self reference)" + "\n");
					br.write("\t\t+ Offset: " + B.action.offset + "\n");
				} 
				else if (B.action instanceof NeighborReference) 
				{
					br.write("\t\t+ Option: " + B.action.type  + " (Neighbor reference)" + "\n");
					br.write("\t\t+ Offset: " + B.action.offset + "\n");
				}
				else if (B.action instanceof SpaceReference_Static) 
				{
					SpaceReference_Static s_r = (SpaceReference_Static) B.action;
					br.write("\t\t+ Option: " + B.action.type  + " (Self space)" + "\n");
					br.write("\t\t+ Offset: " + B.action.offset + "\n");
					br.write("\t\t+ Act_on_empty_segment: " + s_r.act_on_empty_space + "\n");
					br.write("\t\t+ Segment_com_filter: " + s_r.act_on_space_property + "\n");
					br.write("\t\t+ Segment_distance_filter: " + s_r.heading_option_combination + "\n");
					
					for (int l = 0; l < s_r.filter_chain.size(); l++) 
					{
						br.write("\t\t+ Filter: #" + l + "\n");

						Filter F = s_r.filter_chain.get(l);

						br.write("\t\t\t+ Filtered property: " + F.filtered_p + "\n");

						if (F instanceof Filter_ranged) {
							Filter_ranged frange = (Filter_ranged) F;
							br.write("\t\t\t+ Numeritc ranged: [" + frange.lowerRange + " , " + frange.upperRange + "]"
									+ "\n");
							br.write("\t\t\t+ Category ranged: " + frange.filtered_set + "\n");
						} else if (F instanceof Filter_method) {
							Filter_method fm = (Filter_method) F;
							if (fm.method == 1) {
								br.write("\t\t\t+ Combine method: " + fm.method + " (Relative: nearest)" + "\n");
							} else if (fm.method == 2) {
								br.write("\t\t\t+ Combine method: " + fm.method + " (Relative: farthest)" + "\n");
							} else if (fm.method == 3) {
								br.write("\t\t\t+ Combine method: " + fm.method + " (Absolute: max)" + "\n");
							} else if (fm.method == 4) {
								br.write("\t\t\t+ Combine method: " + fm.method + " (Absolute: min)" + "\n");
							} else if (fm.method == 5) {
								br.write("\t\t\t+ Combine method: " + fm.method + " (Absolute: random)" + "\n");
							}
						}
					}
				} 
				
				if (B.action instanceof NeighborReference)
				{
					NeighborReference n_r = (NeighborReference) B.action;
				
					for (int l = 0; l < n_r.filter_chain.size(); l++) 
					{
						br.write("\t\t+ Filter: #" + l + "\n");

						Filter F = n_r.filter_chain.get(l);

						br.write("\t\t\t+ Filtered property: " + F.filtered_p + "\n");

						if (F instanceof Filter_ranged) {
							Filter_ranged frange = (Filter_ranged) F;
							br.write("\t\t\t+ Numeritc ranged: [" + frange.lowerRange + " , " + frange.upperRange + "]"
									+ "\n");
							br.write("\t\t\t+ Category ranged: " + frange.filtered_set + "\n");
						} else if (F instanceof Filter_method) {
							Filter_method fm = (Filter_method) F;
							if (fm.method == 1) {
								br.write("\t\t\t+ Combine method: " + fm.method + " (Relative: nearest)" + "\n");
							} else if (fm.method == 2) {
								br.write("\t\t\t+ Combine method: " + fm.method + " (Relative: farthest)" + "\n");
							} else if (fm.method == 3) {
								br.write("\t\t\t+ Combine method: " + fm.method + " (Absolute: max)" + "\n");
							} else if (fm.method == 4) {
								br.write("\t\t\t+ Combine method: " + fm.method + " (Absolute: min)" + "\n");
							} else if (fm.method == 5) {
								br.write("\t\t\t+ Combine method: " + fm.method + " (Absolute: random)" + "\n");
							}
						}
					}
				}
				
			}
		}

		br.write("}" + "\n\n\n");

		br.close();
		fr.close();
	}

	public static ArrayList<BehaviorGroup> addModelFromText(String s) 
	{

		ArrayList<BehaviorGroup> behavior_Group = new ArrayList<BehaviorGroup>();

		double act_on_p  = 0;
		
		s = s.replaceAll("\n|\t", " ");

		// Break into different behavior group
		String s_BG[] = s.split("Behavior Group");

		// For each behavior group
		// Split into different behavior
		for (int i = 1; i < s_BG.length; i++) {
			BehaviorGroup BG = null;
			// Each behavior inside a behavior Group
			String s_B[] = s_BG[i].split("Behavior");

			// Match the act on property for behavior Group
			if (s_B[0].matches("(.*)Extracted property:(.*)") == true) 
			{
				s_B[0] = s_B[0].replaceAll("[^0-9\\.]+", " ");
				String temp[] = s_B[0].trim().split(" ");

				act_on_p = Double.parseDouble(temp[1]);

				BG = new BehaviorGroup(act_on_p);
			}

			for (int j = 1; j < s_B.length; j++) 
			{
				// Split into Activation and Action part
				if (s_B[j].matches("(.*)Activation(.*)") == true) {
					//// Extract activation part
					// Activation activation_t;

					String s_part[] = s_B[j].split("Action ");

					// System.out.println(s_B[2]);
					// First s_part is Activation
					// Second s_part is Action

					String s_activation[] = s_part[0].split("_|\\+");
					
					s_activation[1] = s_activation[1].replaceAll("[^0-9\\.]+", " ");

					String temp[] = s_activation[8].trim().split(" ");

					// Extract activation function
					int activation_function_option = Integer.valueOf(temp[2]);

					Activation_function AF = new Activation_function();
					// Extract activation option
					if (activation_function_option == 0) 
					{
						temp = s_activation[7].trim().split(" ");
						double weight = Double.valueOf(temp[1]);
						
						AF = new Activation_function(activation_function_option,weight);
					} 
					else if (activation_function_option == 1) 
					{
						temp = s_activation[9].trim().split(" ");
						
						boolean inside = true;

						if (temp[2].equals("false")) 
						{
							inside = false;
						}

						temp = s_activation[10].trim().split(" ");
						double weight = Double.valueOf(temp[1]);
						
						AF = new Activation_function_binary(weight, inside);

					} 
					else if (activation_function_option == 2) 
					{
						temp = s_activation[9].trim().split(" ");

						double slope = Double.valueOf(temp[2]);

						boolean increase = true;

						temp = s_activation[10].trim().split(" ");

						if (temp[2].equals("false")) 
						{
							increase = false;
						}

						AF = new Activation_function_linear(slope, increase);
					}

  					temp = s_activation[5].trim().split(" ");

					int activation_option = Integer.valueOf(temp[1]);

					if (activation_option == 0) 
					{
						activation = new Activation(AF);
					} 
					else if (activation_option == 1) 
					{
						// Extract checking property
						temp = s_activation[1].split(" ");
						double checking_p = Double.valueOf(temp[1]);

						// Extract lower range
						temp = s_activation[2].split(" ");
						double lower_range = Double.valueOf(temp[2]);

						// Extract upper range
						temp = s_activation[3].split(" ");
						double upper_range = Double.valueOf(temp[2]);

						// Extract set range
						s_activation[4] = s_activation[4].replaceAll("[^0-9,-\\.]+", "");
						temp = s_activation[4].split(",");

						ArrayList<Double> range_temp = new ArrayList<Double>();

						for (String s1 : temp) {
							// If the range set is empty, not add to the range_set
							if (s1.length() != 0) {
								range_temp.add(Double.valueOf(s1));
							}

						}

						// If range set is empty -> criteria must be for numeric property
						if (range_temp.size() == 0) 
						{
							activation = new Activation(checking_p, lower_range, upper_range, AF);
						}
						else 
						{
							activation = new Activation(checking_p, range_temp, AF);
						}

					} 
					else if (activation_option == 2) 
					{
						String component[] = s_part[0].split("Filter: #");

						String component_sub0[] = component[0].split("_|\\+");

						//Activation specification
						temp = component_sub0[1].split(" ");
						double checking_p = Double.valueOf(temp[3]);

						temp = component_sub0[2].split(" ");
						double lower_range = Double.valueOf(temp[2]);

						temp = component_sub0[3].split(" ");
						double upper_range = Double.valueOf(temp[2]);

						ArrayList<Double> range_temp = new ArrayList<Double>();

						component_sub0[4] = component_sub0[4].replaceAll("[^0-9,\\.]+", "");

						temp = component_sub0[4].split(",");

						for (String s1 : temp) 
						{
							// If the range set is empty, not add to the range_set
							if (s1.length() != 0) 
							{
								range_temp.add(Double.valueOf(s1));
							}

						}

						boolean null_act = false;
						// If AF is binary
						if (activation_function_option == 1) 
						{
							// Get null activation value here
							temp = component_sub0[11].split(": ");
						}
						// If AF is linear
						else if (activation_function_option == 2) {
							// Get null activation value here
							temp = component_sub0[11].split(": ");
						}

						if (temp[1].matches("(.*)true(.*)")) 
						{
							null_act = true;
						}
						else if (temp[1].matches("(.*)false(.*)")) 
						{
							null_act = false;
						}
						else
						{
							System.out.println("Error when import null activation");
						}

						filter_chain = new ArrayList<Filter>();

						// Extract filters
						for (int k = 1; k < component.length; k++) {

							String filter_component[] = component[k].split("\\+");

							// If filter is ranged filter
							if (component[k].matches("(.*)(R|r)anged(.*)") == true) {
								temp = filter_component[1].split(" ");
								double filter_p = Double.valueOf(temp[3]);

								filter_component[2] = filter_component[2].replaceAll("[^0-9,-\\.]+", "");

								temp = filter_component[2].split(",");

								double lower_range_f = Double.valueOf(temp[0]);

								double upper_range_f = Double.valueOf(temp[1]);

								ArrayList<Double> category_range_temp = new ArrayList<Double>();

								filter_component[3] = filter_component[3].replaceAll("[^0-9,\\.]+", "");

								temp = filter_component[3].split(",");

								for (String s1 : temp) {
									// If the range set is empty, not add to the range_set
									if (s1.length() != 0) {
										category_range_temp.add(Double.valueOf(s1));
									}

								}

								// If category size = 0 -> this must be range filter for numeric property
								if (category_range_temp.size() == 0) 
								{
									filter_chain.add(new Filter_ranged(filter_p, lower_range_f, upper_range_f,0));
								}
								// If category size != 0 -> this must be set range filter for catagory property
								else 
								{
									filter_chain.add(new Filter_ranged(filter_p, category_range_temp,0));
								}

							}
							// If filter is combine filter
							else if (component[k].matches("(.*)(C|c)ombine(.*)") == true) 
							{
								temp = filter_component[1].split(" ");
								
								double filter_p = Double.valueOf(temp[3]);

								filter_component[2] = filter_component[2].replaceAll("[^0-9,\\.]+", "");

								temp = filter_component[2].split(" ");

								int combine_method = Integer.valueOf(temp[0]);

								filter_chain.add(new Filter_method(filter_p, combine_method));
							}

						}

						//Import an activation with getting checking value from neighbor
						if (range_temp.size() == 0) 
						{
							activation = new Activation(filter_chain, checking_p, lower_range, upper_range, null_act, AF);
						} 
						else 
						{
							activation = new Activation(filter_chain, checking_p, range_temp, null_act, AF);
						}

					}
					else if (activation_option == 3) 
					{
						String component[] = s_part[0].split("Filter: #");

						String component_sub0[] = component[0].split("_|\\+");

						//Activation specification
						temp = component_sub0[1].split(" ");
						double checking_p = Double.valueOf(temp[3]);

						temp = component_sub0[2].split(" ");
						double lower_range = Double.valueOf(temp[2]);

						temp = component_sub0[3].split(" ");
						double upper_range = Double.valueOf(temp[2]);

						ArrayList<Double> range_temp = new ArrayList<Double>();

						component_sub0[4] = component_sub0[4].replaceAll("[^0-9,\\.]+", "");

						temp = component_sub0[4].split(",");

						for (String s1 : temp) 
						{
							// If the range set is empty, not add to the range_set
							if (s1.length() != 0) 
							{
								range_temp.add(Double.valueOf(s1));
							}

						}

						boolean null_act = false;
						// If AF is binary
						if (activation_function_option == 1) 
						{
							// Get null activation value here
							temp = component_sub0[11].split(": ");
						}
						// If AF is linear
						else if (activation_function_option == 2) {
							// Get null activation value here
							temp = component_sub0[11].split(": ");
						}

						if (temp[1].matches("(.*)true(.*)")) 
						{
							null_act = true;
						}
						else if (temp[1].matches("(.*)false(.*)")) 
						{
							null_act = false;
						}
						else
						{
							System.out.println("Error when import null activation");
						}

						component_sub0[12] = component_sub0[12].replaceAll("[^0-9,-\\.]+", "");
						
						temp = component_sub0[12].split(" ");
						
						int act_on_empty_segment = Integer.valueOf(temp[0]);
								
						component_sub0[13] = component_sub0[13].replaceAll("[^0-9,-\\.]+", "");
						
						temp = component_sub0[13].split(" ");
						
						double act_on_space_property = Double.valueOf(temp[0]);
												
						
						component_sub0[14] = component_sub0[14].replaceAll("[^0-9,-\\.]+", "");
						
						temp = component_sub0[14].split(" ");
						
						int segment_distance = Integer.valueOf(temp[0]);
						
						//B = new Behavior(activation, action_offset, act_on_empty_segment, segment_combination, segment_distance);
						
						filter_chain = new ArrayList<Filter>();

						// Extract filters
						for (int k = 1; k < component.length; k++) {

							String filter_component[] = component[k].split("\\+");

							// If filter is ranged filter
							if (component[k].matches("(.*)(R|r)anged(.*)") == true) {
								temp = filter_component[1].split(" ");
								double filter_p = Double.valueOf(temp[3]);

								filter_component[2] = filter_component[2].replaceAll("[^0-9,-\\.]+", "");

								temp = filter_component[2].split(",");

								double lower_range_f = Double.valueOf(temp[0]);

								double upper_range_f = Double.valueOf(temp[1]);

								ArrayList<Double> category_range_temp = new ArrayList<Double>();

								filter_component[3] = filter_component[3].replaceAll("[^0-9,\\.]+", "");

								temp = filter_component[3].split(",");

								for (String s1 : temp) {
									// If the range set is empty, not add to the range_set
									if (s1.length() != 0) {
										category_range_temp.add(Double.valueOf(s1));
									}

								}

								// If category size = 0 -> this must be range filter for numeric property
								if (category_range_temp.size() == 0) 
								{
									filter_chain.add(new Filter_ranged(filter_p, lower_range_f, upper_range_f,0));
								}
								// If category size != 0 -> this must be set range filter for catagory property
								else {
									filter_chain.add(new Filter_ranged(filter_p, category_range_temp,0));
								}

							}
							// If filter is combine filter
							else if (component[k].matches("(.*)(C|c)ombine(.*)") == true) 
							{
								temp = filter_component[1].split(" ");
								
								double filter_p = Double.valueOf(temp[3]);

								filter_component[2] = filter_component[2].replaceAll("[^0-9,\\.]+", "");

								temp = filter_component[2].split(" ");

								int combine_method = Integer.valueOf(temp[0]);

								filter_chain.add(new Filter_method(filter_p, combine_method));
							}

						}
						
						SpaceReference_Static action_for_activation = new SpaceReference_Static(0 , filter_chain, act_on_empty_segment, act_on_space_property, segment_distance, act_on_p);
						//This activation for now always use range criteria
						activation = new Activation(act_on_space_property, action_for_activation, lower_range, upper_range, null_act, AF);
						 	
					}

					///// Extract action part
					String filter[] = s_part[1].split("Filter: ");

					String action_component[] = filter[0].split("\\+");

					action_component[1] = action_component[1].replaceAll("[^0-9,\\.]+", "");

					temp = action_component[1].split(" ");

					// Get action option
					int action_option = Integer.valueOf(temp[0]);

					action_component[2] = action_component[2].replaceAll("[^0-9,-\\.]+", "");

					temp = action_component[2].split(" ");
					
					double action_offset = 0;
					
					//Offset has negative value
					if (temp[0].substring(0, 1).equalsIgnoreCase("-"))
					{
						//If offset value is from 0.0 - 9.0
						if (temp[0].substring(2, 3).equalsIgnoreCase("."))
						{
							
							action_offset = Double.valueOf(temp[0].substring(1, 4));
						}
						//if offset value is from 10.0 - 99.0
						else if (temp[0].substring(3, 4).equalsIgnoreCase("."))
						{
							action_offset = Double.valueOf(temp[0].substring(1, 5));
						}
						//if offset value is from 100.0 - 999.0
						else if (temp[0].substring(4, 5).equalsIgnoreCase("."))
						{
							action_offset = Double.valueOf(temp[0].substring(1, 6));
						}
						else
						{
							System.out.println("Check output for offset in addModelFromText");
						}
						
						action_offset = -action_offset;
					}
					else
					{
						//If offset value is from 0.0 - 9.0
						if (temp[0].substring(1, 2).equalsIgnoreCase("."))
						{
							action_offset = Double.valueOf(temp[0].substring(0, 3));
						}
						//if offset value is from 10.0 - 99.0
						else if (temp[0].substring(2, 3).equalsIgnoreCase("."))
						{
							action_offset = Double.valueOf(temp[0].substring(0, 4));
						}
						//if offset value is from 100.0 - 999.0
						else if (temp[0].substring(3, 4).equalsIgnoreCase("."))
						{
							action_offset = Double.valueOf(temp[0].substring(0, 5));
						}
						else
						{
							System.out.println("Check output for offset in addModelFromText");
						}
					}
					
					
					
					

					Behavior B = null;

					// Self reference
					if (action_option == 0) 
					{
						//B = new Behavior(activation, action_offset);
						action = new SelfReference(action_offset, act_on_p);
						B = new Behavior(activation, action);
					}
					// Neighbor reference
					else if (action_option == 1 || action_option == 2) 
					{
						filter_chain = new ArrayList<Filter>();
						// Loop to extract each filter
						for (int k = 1; k < filter.length; k++) {
							String filter_component[] = filter[k].split("\\+");

							// If filter is ranged filter
							if (filter[k].matches("(.*)(R|r)anged(.*)") == true) 
							{
								temp = filter_component[1].split(" ");
								double filter_p = Double.valueOf(temp[3]);

								filter_component[2] = filter_component[2].replaceAll("[^0-9,-\\.]+", "");

								temp = filter_component[2].split(",");

								double lower_range_f = Double.valueOf(temp[0]);

								double upper_range_f = Double.valueOf(temp[1]);

								ArrayList<Double> category_range_temp = new ArrayList<Double>();

								filter_component[3] = filter_component[3].replaceAll("[^0-9,\\.]+", "");

								temp = filter_component[3].split(",");

								for (String s1 : temp) {
									// If the range set is empty, not add to the range_set
									if (s1.length() != 0) {
										category_range_temp.add(Double.valueOf(s1));
									}

								}

								// If category size = 0 -> this must be range filter for numeric property
								if (category_range_temp.size() == 0) {
									filter_chain.add(new Filter_ranged(filter_p, lower_range_f, upper_range_f,1));
								}
								// If category size != 0 -> this must be set range filter for catagory property
								else {
									filter_chain.add(new Filter_ranged(filter_p, category_range_temp,1));
								}

							}
							// If filter is combine filter
							else if (filter[k].matches("(.*)(C|c)ombine(.*)") == true) 
							{
								temp = filter_component[1].split(" ");
								double filter_p = Double.valueOf(temp[3]);

								filter_component[2] = filter_component[2].replaceAll("[^0-9,\\.]+", "");

								temp = filter_component[2].split(" ");

								int combine_method = Integer.valueOf(temp[0].substring(0, 1));

								filter_chain.add(new Filter_method(filter_p, combine_method));
							}
						}

						if (action_option == 1)
						{
							//B = new Behavior(activation, filter_chain, action_offset);
							action = new NeighborReference(action_offset, filter_chain, act_on_p);
							B = new Behavior(activation, action);
						}
						else if (action_option == 2)
						{
							action_offset = Double.valueOf(action_component[2]);
							
							action_component[3] = action_component[3].replaceAll("[^0-9,-\\.]+", "");
							
							temp = action_component[3].split(" ");
							
							int act_on_empty_segment = Integer.valueOf(temp[0]);
									
							action_component[4] = action_component[4].replaceAll("[^0-9,-\\.]+", "");
							
							temp = action_component[4].split(" ");
							
							double segment_combination = Double.valueOf(temp[0]);
													
							
							action_component[5] = action_component[5].replaceAll("[^0-9,-\\.]+", "");
							
							temp = action_component[5].split(" ");
							
							//For now, this is always 1 digit;
							int segment_distance = Integer.valueOf(temp[0].substring(0,1));
							
							//B = new Behavior(activation, action_offset, act_on_empty_segment, segment_combination, segment_distance);
							
							action = new SpaceReference_Static(action_offset , filter_chain, act_on_empty_segment, segment_combination, segment_distance, act_on_p);
							
							B = new Behavior(activation, action);
						}
						
					}
					
					// Add the behavior to behavior group

					BG.behavior_set.add(B);

				}
			}

			behavior_Group.add(BG);

			// BehaviorGroup BG = new BehaviorGroup(1);

		}

		// System.out.println("End");
		return behavior_Group; 
	}

	
	
	static ArrayList<BehaviorGroup> testing() 
	{
		
		// BehaviorGroup - each BG act on 1 property only
		ArrayList<BehaviorGroup> behavior_Group = new ArrayList<BehaviorGroup>();
		/*
		// Act on property: position
		BehaviorGroup BG1 = new BehaviorGroup(1);

		filter_chain = new ArrayList<Filter>();

		// Example of range filter
		// filter_chain.add(new Filter_ranged(1,0,60));

		// Example of category filter
		// filter_chain.add(new Filter_ranged(5,new ArrayList<Double>(Arrays.asList(2.0,
		// 3.0))));

		// Example of method filter
		// filter_chain.add(new Filter_method(1,1));

		// Example of default activation
		// activation = new Activation();

		// Example of self check activation - binary - numeric
		// activation = new Activation(3, 0, 1, new Activation_function(true));

		// Example of self check activation - binary - category
		// activation = new Activation(5, new ArrayList<Double>(Arrays.asList(2.0,3.0)),
		// new Activation_function(true));

		// Example of self check activation - linear - numeric
		// activation = new Activation(4, new ArrayList<Double>(Arrays.asList(2.0,3.0)),
		// new Activation_function(2, true));

		// Example of neighbor check activation - binary - numeric
		// filter_chain.add(new Filter_ranged(4, new
		// ArrayList<Double>(Arrays.asList(1.0))));
		// activation = new Activation(filter_chain, 1 , 0, 50, false, new
		// Activation_function(true));
		// Example of neighbor check activation - binary - category
		// activation = new Activation(filter_chain, 1 , new
		// ArrayList<Double>(Arrays.asList(3.0)), false, new
		// Activation_function(false));
		// Example of neighbor check activation - linear - numeric
		// activation = new Activation(filter_chain, 1 , 0, 50, false, new
		// Activation_function(2, false));
		// Example of neighbor check activation - linear - category
		// None

		// Example of self check activation - linear - category
		// filter_chain.add(new Filter_ranged(4,new ArrayList<Double>(Arrays.asList(2.0,
		// 3.0))));
		Activation_function af = new Activation_function(10);
		activation = new Activation(af);
		Behavior B1_1 = new Behavior(activation, 0);
		BG1.behavior_set.add(B1_1);

		activation = new Activation(af);
		filter_chain = new ArrayList<Filter>();
		filter_chain.add(new Filter_ranged(4, new ArrayList<Double>(Arrays.asList(1.0))));
		activation = new Activation(filter_chain, 1, 0, 100, false, new Activation_function_linear(100, true));

		filter_chain = new ArrayList<Filter>();
		// filter_chain.add(new Filter_ranged(5,0,60));
		filter_chain.add(new Filter_ranged(4, new ArrayList<Double>(Arrays.asList(1.0))));
		//Behavior B1_2 = new Behavior(activation, filter_chain, 20);

		// BG1.behavior_set.add(B1_2);

		//behavior_Group.add(BG1);

		BehaviorGroup BG2 = new BehaviorGroup(1);
		activation = new Activation(af);
		Behavior B2_1 = new Behavior(activation, 2);
		//BG2.behavior_set.add(B2_1);
		//behavior_Group.add(BG2);
		*/
		
		return behavior_Group;
	}
	
	static String readFile(String fileName) throws IOException 
	{
	    BufferedReader br = new BufferedReader(new FileReader(fileName));
	    try 
	    {
	        StringBuilder sb = new StringBuilder();
	        String line = br.readLine();

	        while (line != null) 
	        {
	            sb.append(line);
	            sb.append("\n");
	            line = br.readLine();
	        }
	        return sb.toString();
	    } 
	    finally 
	    {
	        br.close();
	    }
	}
	
	static ArrayList<ArrayList<Entity>> createEntityList( int number_of_simulation)
	{
		ArrayList<ArrayList<Entity>> entity_list = new ArrayList<ArrayList<Entity>>();
		
		for (int j = 0; j < number_of_simulation; j++) 
		{
			entities = new ArrayList<Entity>();
			
			obstacles = setHardcodeObstacle();
			
			for (Obstacle o : obstacles) 
			{
				if (global_var.search_Model == true)
				{
					if (o instanceof Obstacle_circle)
					{
						/*
						 if (j == 0 || j == 1)
						 {
							// o = new Obstacle_circle(new Position(120, 135), 10, 2.1);
							 
							 // o = new Obstacle_circle(new Position(130, 133), 10, 2.1);
							 
							 
						 }
						 
						 else if (j == 1)
						 {
							 o = new Obstacle_circle(new Position(110, 135), 20, 2.1);
						 }
						 
						 else if (j == 1)
						 {
							 o = new Obstacle_circle(new Position(102, 135), 30, 2.1);
						 }
						 */
						 
						
						 
					}
				}
			
				entities.add(o);
			}
			
			goals = setHardcodeGoal();
			
			for (Goal g : goals) 
			{
				entities.add(g);
			}
			
			
			// Create a random initial set up for agent
			if (global_var.init_agent.equals("random")) 
			{
				
				
				for (int k = 0; k < global_var.num_of_agents; k++) 
				{ 
					 
					Agent single_agent = new Agent(global_var.init_agent, k, entities);

					single_agent.addConstraint(constraint_set);

					entities.add(single_agent); 
					
				}
				
				
			}
			else if (global_var.init_agent.equals("hardcode")) 
			{
				
				Position pos = new Position(100,200);     
				//Position pos = new Position(145 , 145);    
				Agent agent1 = new Agent(pos, 0 , 2.0, 1.0);
				agent1.addConstraint(constraint_set);
				//agent1.addBehavior(behavior_Group);
				// agent1.property_set.get(0).value = 50;
				
				//Set zone values
				for (Goal g : Main.goals)
				{
					if (g instanceof Goal_rectangle)
					{
						if (agent1.getCurrentZone((Goal_rectangle) g) != 0)
						{
							agent1.zone_in.value = g.type.value;
						}
					}	
				}
				
				entities.add(agent1);
				
				
				for (int k = 0; k < 0; k++) 
				{ 
					Agent single_agent = new Agent(global_var.init_agent, k, entities);

					entities.add(single_agent); 
				}
				
				
				pos = new Position(150,100);
				Agent agent3 = new Agent(pos, 0, 1, 1.0);
				agent3.addConstraint(constraint_set);
				//agent3.addBehavior(behavior_Group);
				// agent3.property_set.get(0).value = 30;
				//entities.add(agent3);

				//Set zone values
				for (Goal g : Main.goals)
				{
					if (g instanceof Goal_rectangle)
					{
						if (agent3.getCurrentZone((Goal_rectangle) g) != 0)
						{
							agent3.zone_in.value = g.type.value;
						}
					}	
				}
				
				//pos = new Position(128,120);
				pos = new Position(150,150);
				Agent agent2 = new Agent(pos, 0, 1, 1.0);
				agent2.addConstraint(constraint_set);
				agent2.check = false;
				//agent2.addBehavior(behavior_Group);
				// agent2.property_set.get(0).value = 45;
				//entities.add(agent2);

				//Set zone values
				for (Goal g : Main.goals)
				{
					if (g instanceof Goal_rectangle)
					{
						if (agent2.getCurrentZone((Goal_rectangle) g) != 0)
						{
							agent2.zone_in.value = g.type.value;
						}
					}	
				}
				
				
				pos = new Position(100, 150);
				Agent agent4 = new Agent(pos, 0, 1, 1.0);
				//agent2.addBehavior(behavior_Group);
				// agent2.property_set.get(0).value = 45;
				//entities.add(agent4);

				
				pos = new Position(31, 31);
				Agent agent5 = new Agent(pos, 0, 0, 1.0);
				//agent2.addBehavior(behavior_Group);
				// agent2.property_set.get(0).value = 45;
				//entities.add(agent5);
				
				//Set zone values
				for (Goal g : Main.goals)
				{
					if (g instanceof Goal_rectangle)
					{
						if (agent4.getCurrentZone((Goal_rectangle) g) != 0)
						{
							agent4.zone_in.value = g.type.value;
						}
					}	
				}
			}
		
			entity_list.add(entities);
		}
		
		//Next 6
		return entity_list;
	}
	
	static public ArrayList<Obstacle> setHardcodeObstacle() 
	{
		ArrayList<Obstacle> obstacle_set = new ArrayList<Obstacle>();
		 
		Obstacle o1, o2, o3, o4, o5, o6, o7, o8, o9, o10;

		double obs_speed = 1;
		
		ArrayList<Integer> radius = new ArrayList<Integer>(Arrays.asList(10,18,25));
		
		Random rand = new Random();
		
		ArrayList<Entity> obstalce_placement = new ArrayList<Entity>();
		
		
		for (int i = 0; i < global_var.num_of_obstacles; i++)
		{
			Obstacle_circle o = new Obstacle_circle(new Position(0, 0), 10, 2.1);
			
			//position.createRandomPositionInFixZone(new Zone_rectangle(1.0, new Position(0,0),Main.global_var.WorldSize_height,Main.global_var.WorldSize_height), entity);
			o.pos.createRandomPositionInFixZone(new Zone_rectangle(1.0, new Position(0,0),Main.global_var.WorldSize_height,Main.global_var.WorldSize_height), obstalce_placement);
			o.radius = radius.get(rand.nextInt(radius.size()));
			ArrayList<Integer> angle_change_list = new ArrayList<Integer>(Arrays.asList(30,60,90,120,150,180));
			o.heading = angle_change_list.get(rand.nextInt(angle_change_list.size()));
			
			obstacle_set.add(o);
			obstalce_placement.add(o);
		}
		
		
		
		o1 = new Obstacle_circle(new Position(350, 300), 20, 2.1);
		Obstacle_circle o1_c = (Obstacle_circle) o1;
		o1_c.speed = 0.5;
		o1_c.heading = 180;
		//obstacle_set.add(o1);
		/*
		
		
		o2 = new Obstacle_circle(new Position(400, 500), 15, 2.1);
		Obstacle_circle o2_c = (Obstacle_circle) o2;
		o2_c.speed = obs_speed;
		o2_c.heading = 90;
		obstacle_set.add(o2);
		
		o3 = new Obstacle_circle(new Position(100, 400), 25, 2.1);
		Obstacle_circle o3_c = (Obstacle_circle) o3;
		o3_c.speed = obs_speed;
		o3_c.heading = 275;
		obstacle_set.add(o3);
		
		
		//Big circle in middle
		o4 = new Obstacle_circle(new Position(340, 120),15, 2.1);
		Obstacle_circle o4_c = (Obstacle_circle) o4;
		o4_c.speed = obs_speed;
		o4_c.heading = 45;
		obstacle_set.add(o4);
		
		o5 = new Obstacle_circle(new Position(150, 160), 25, 2.1);
		Obstacle_circle o5_c = (Obstacle_circle) o5;
		o5_c.speed = obs_speed;
		o5_c.heading = 270;
		obstacle_set.add(o5);
		
		
		o6 = new Obstacle_circle(new Position(30, 320), 15, 2.1);
		Obstacle_circle o6_c = (Obstacle_circle) o6;
		o6_c.speed = obs_speed;
		o6_c.heading = 270;
		obstacle_set.add(o6);
		
		o7 = new Obstacle_circle(new Position(150, 350), 25, 2.1);
		Obstacle_circle o7_c = (Obstacle_circle) o7;
		o7_c.speed = obs_speed;
		o7_c.heading = 270;
		obstacle_set.add(o7);
		
		
		o8 = new Obstacle_circle(new Position(50, 120), 15, 2.1);
		Obstacle_circle o8_c = (Obstacle_circle) o8;
		o8_c.speed = obs_speed;
		o8_c.heading = 270;
		obstacle_set.add(o8);
		
		
		o9 = new Obstacle_circle(new Position(300, 300), 25, 2.1);
		Obstacle_circle o9_c = (Obstacle_circle) o9;
		o9_c.speed = obs_speed;
		o9_c.heading = 270;
		obstacle_set.add(o9);
		
		o10 = new Obstacle_circle(new Position(350, 50), 15, 2.1);
		Obstacle_circle o10_c = (Obstacle_circle) o10;
		o10_c.speed = obs_speed;
		o10_c.heading = 270;
		obstacle_set.add(o10);
		*/
		
		return obstacle_set;
		
	}

	static public ArrayList<Goal> setHardcodeGoal() 
	{
		ArrayList<Goal> goal_set = new ArrayList<Goal>();
		
		Random rand = new Random();
		
		/*
		for (int i = 0 ; i < 1; i++)
		{
			Goal_point g = new Goal_point(new Position(200,300), 3.1);
			
			ArrayList<Entity> leader_placement = new ArrayList<Entity>();
			
			//g.position.createRandomPositionInFixZone(new Zone_rectangle(1.0, new Position(0,0),Main.global_var.WorldSize_height,Main.global_var.WorldSize_height), leader_placement );
			g.speed = 0.75;
			ArrayList<Integer> angle_change_list = new ArrayList<Integer>(Arrays.asList(30,60,90,120,150,180));
			//g.heading = angle_change_list.get(rand.nextInt(angle_change_list.size()));
			
			g.heading = 0;
			goal_set.add(g);
			leader_placement.add(g);

		}
		*/
		
		Goal_point goal_p1 = new Goal_point(new Position(100,200), 3.1);
		goal_p1.speed = 1;
		goal_p1.heading = 0;
		goal_set.add(goal_p1);
		/*
		Goal_point goal_p2 = new Goal_point(new Position(400,450), 3.1);
		goal_p2.speed = 1;
		goal_p2.heading = 135;
		
		Goal_point goal_p3= new Goal_point(new Position(250,250), 3.1);
		goal_p3.speed = 1;
		goal_p3.heading = 0;
		
		goal_set.add(goal_p1);
		goal_set.add(goal_p2);
		//goal_set.add(goal_p3);
		*/
		
		return goal_set;
	}

	static public ArrayList<Zone> setZone() 
	{

		ArrayList<Zone> zone_set = new ArrayList<Zone>();

	
		return zone_set;
	}
	
	static void addConstraint()
	{
		//Add angle constraint
		
		Constraint c1 = new Constraint(2,180,-180,360,-360);
		
		constraint_set.add(c1);
		
		//Add speed constraint
		//Constraint c2 = new Constraint(3,0.01,0.05,2,1);
		
		//constraint_set.add(c2);
	}
	
	
	
}


class SortbyFitnessMetric implements Comparator<Model> 
{
	// Used for sorting in decending order of
	// roll number
	public int compare(Model a, Model b) {
		if (a.fitnessMetric - b.fitnessMetric < 0) {
			return 1;
		} else if (a.fitnessMetric - b.fitnessMetric > 0) {
			return -1;
		} else {
			return 0;
		}
	}
}

class SortbyAverageScore implements Comparator<DataStruct_Cellspace_Setting> {
	// Used for sorting in decending order of
	// roll number
	public int compare(DataStruct_Cellspace_Setting a, DataStruct_Cellspace_Setting b) 
	{
		if (a.average - b.average < 0) 
		{
			return 1;
		} else if (a.average - b.average > 0) {
			return -1;
		} else {
			return 0;
		}
	}
}
