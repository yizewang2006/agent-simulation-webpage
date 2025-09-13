package searchMethod;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.Random;
import java.util.concurrent.ThreadLocalRandom;

import Action.Action;
import Action.NeighborReference;
import Action.SelfReference;
import Action.SpaceReference_Expand;
import Action.SpaceReference_Static;
import Activation.Activation;
import Activation.CategoryCriteria;
import Activation.RangeCriteria;
import Activation_getCheckingValue.NeighborChecking_Value;
import Activation_getCheckingValue.SelfChecking_Value;
import Activation_getCheckingValue.SpaceChecking_Value;
import Goal.Goal;
import Goal.Goal_rectangle;
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
import core.Main;
import core.Model;
import entities.Entity;
import filters.Filter;
import filters.Filter_method;
import filters.Filter_ranged;
import obstacles.Obstacle;
import zones.Zone;

public class GeneticAlgorithm 
{
	
	public GlobalVariable global_var = new GlobalVariable();
	public myUtility myUtility = new myUtility();
	
	public ArrayList<Model> old_generation = new ArrayList<Model>();
	public ArrayList<Model> new_generation = new ArrayList<Model>();
	public ArrayList<Integer> index_list = new ArrayList<Integer>();
	
	public int success_crossover = 0;
	public int success_mutate = 0;
	
	public ArrayList<ArrayList<Entity> > entity_list =  new ArrayList<ArrayList<Entity>>(); 
	public int gen_th;
	
	//Dummy constructor
	public GeneticAlgorithm()
	{
		
	}
	
	public GeneticAlgorithm(ArrayList<Model> models)
	{
		this.old_generation = myUtility.deepCopyArrayListModel(models);
		
		for(int i = 0; i < global_var.num_model; i++)
		{
			index_list.add(i);
		}
	}
	
	public ArrayList<Model> runGA(ArrayList<ArrayList<Entity>> entity_list, int gen_th) throws InterruptedException
	{		
		this.entity_list = entity_list;
		
		//There are 4 portion for the next generation
		int portion = global_var.num_model / 4;
				
		//Choose a random model from the population
		//Using Roulette Wheel selection.

		//Get sum of fitness score
		double sum_fitness_score = 0;

		for (Model m : old_generation)
		{
			sum_fitness_score += m.fitnessMetric;
		}

		//Normalize fitness Metric of models in old_generation
		//so get their sum equal to 1
		ArrayList<Double> normalize_score = new ArrayList<Double>();

		//Create the Routtele wheel
		for (Model m : old_generation)
		{

			normalize_score.add(m.fitnessMetric/sum_fitness_score);
		}
		
		ArrayList<Model> selection_population = myUtility.deepCopyArrayListModel(old_generation);
		
		//Adding 25% best model to new generation
		//Roulette wheel for the selection will update the portion of each model after a model is selected.
		//The selected model is removed from the population and the portion is update.
		//It's used to prevent a model's portion is dominant and is selected many time for next generation.
		//and create many duplicated models.
		
		for (int i = 0; i < portion; i++)
		{	
			double selection_sum_fitness_score = 0;
			
			for (Model m : selection_population)
			{
				//Apply age fitness first
				//m.fitnessMetric_dynamic = this.age_FitnessScore(m.fitnessMetric_dynamic , m.age);
				
				//m.fitnessMetric = this.age_FitnessScore(m.fitnessMetric, m.age);
				
				selection_sum_fitness_score += m.fitnessMetric;
			}
			
			ArrayList<Double> selection_normalize_score = new ArrayList<Double>();
			
			for (Model m : selection_population)
			{
				
				selection_normalize_score.add(m.fitnessMetric/selection_sum_fitness_score);
			}
			
			double random_choice = getRandomDouble(0,1);
			
			//Choose a random model in Routtele wheel
			//The more portion model has, the better chance it will be picked
			double partial_sum = 0;

			for(int j = 0; j < selection_normalize_score.size(); j++)
			{
				partial_sum += selection_normalize_score.get(j);
				
				//The model is chosen
				if (random_choice < partial_sum)
				{
					//jth model is chosen
					Model chosen_model = selection_population.get(j);
					Model model1 = deepCopy_Model(chosen_model);
					

					//Remove the chosen_model from the selection population
					selection_population.remove(j);
					new_generation.add(model1);
					break;
				}
			}
			
		}

		//25% maybe CROSS-OVER - chance is 100%
		for (int i = 0; i < portion; i++)
		{
			//System.out.println(i);
			double random_choice = getRandomDouble(0,1);
		
			//Choose a random model in Routtele wheel
			//The more portion model has, the better chance it will be picked
			double partial_sum = 0;

			for(int j = 0; j < normalize_score.size(); j++)
			{
				partial_sum += normalize_score.get(j);
				
				//The model is chosen
				if (random_choice < partial_sum)
				{
					//Choose a random model from the old_generation base on Routtele wheel
					Model parent1 = old_generation.get(j);
					
					do
					{
						//Shuffle the list to choose one model to perform crossover
						Collections.shuffle(index_list);
						
					}while(index_list.get(0) == j);
					
					//The second parent is randomly chosen from old generation.
					//Later on may need to use Routtle wheel 
					//Routtle wheel might not be good here because for the first generation, one model is usuall dominated the whole population.
					//The chance the model crossover with itself is extremely high.
					
					Model parent_2 = old_generation.get(index_list.get(0));
					
					ArrayList<Model> crossover_models = crossOver(parent1, parent_2);
					
				
					if(crossover_models.size() > 0)
					{
						Model model1 = deepCopy_Model(crossover_models.get(0));
						Model model2 = deepCopy_Model(crossover_models.get(1));
					
						

						if (new_generation.size() == 0)
						{
							//Add parent anyway.
							new_generation.add(model1);
							new_generation.add(model2);
						}
						//Make sure no duplicate modes are added
						else
						{
							boolean dublicate_model1 = true;
							boolean dublicate_model2 = true;
							
							
							//Gaurantee that model1 and model2 are not the same as corssover models
							//To prevent the duplication
							if (model1.ID != parent1.ID && model1.ID != parent_2.ID)
							{
								//increase age of models by 1
								//model1.age ++;
								success_crossover++;
								new_generation.add(model1);
								dublicate_model1 = false;
							}
							
							if (model2.ID != parent1.ID && model2.ID != parent_2.ID)
							{
								//increase age of models by 1
								//model2.age ++;
								success_crossover++;
								new_generation.add(model2);
								dublicate_model2 = false;
							}
							
							//Only repeat if cannot add both 
							if (dublicate_model1 == true && dublicate_model2 == true)
							{
								i--;
							}
							
							/*
							for (Model m : new_generation)
							{
								if (isModelStructureEqual(model1, m) == true)
								{
									dublicate_model1 = true;
								}
								
								if (isModelStructureEqual(model2, m) == true)
								{
									dublicate_model2 = true;
								}
								
							}
							
							if (dublicate_model1 == false)
							{
								success_crossover++;
								new_generation.add(model1);
							}
							
							if (dublicate_model2 == false)
							{
								success_crossover++;
								new_generation.add(model2);
							}
							
							//Only repeat if cannot add both 
							if (dublicate_model1 == false && dublicate_model2 == false)
							{
								i--;
							}
							*/
							
						}
						
					}
					break;
				}
			}
		}
		
		//25% may be MUTATE from old population - Roullelte wheel, chance is 100%
		for (int i = 0; i < portion; i++)
		{
			//System.out.println(i);
			double random_choice = getRandomDouble(0,1);
		
			//Choose a random model in Routtele wheel
			//The more portion model has, the better chance it will be picked
			double partial_sum = 0;

			for(int j = 0; j < normalize_score.size(); j++)
			{
				partial_sum += normalize_score.get(j);
				
				//The model is chosen
				if (random_choice < partial_sum)
				{
					//jth model is chosen
					Model chosen_model = old_generation.get(j);
					Model mutate_model = mutate(chosen_model);
					
					if (mutate_model.agents.get(0).behavior_Group.get(0).extracted_p != -1)
					{
						//Increase age of models
						//model1.age ++;
						//new_generation.add(mutate_model);
						if (new_generation.size() == 0)
						{
							//Add parent anyway.
							new_generation.add(mutate_model);
						}
						//Make sure no duplicate modes are added
						else
						{
							boolean dublicate = false;
							
							//Mean mutate model is better than chosen model.
							if (mutate_model.ID != chosen_model.ID)
							{
								success_mutate++;
								new_generation.add(mutate_model);
							}
							else
							{
								i--;
							}
							
							/*
							for (Model m : new_generation)
							{
								if (isModelStructureEqual(mutate_model, m) == true)
								{
									dublicate = true;
								}
							}
							
							if (dublicate == false)
							{
								success_mutate++;
								new_generation.add(mutate_model);
							}
							else
							{
								i--;
							}
							*/
							
							
								
							
						}
					}
					
					break;
				}
			}
		}
		
		
		//At least 25% of random model is added
		//Usually will need more than 25% randomly
		//Because crossover and mutate might not be success
		//Random model will be add until it fulfill the population
		
		int remain_slot = global_var.num_model - new_generation.size();

		for (int i = 0; i < remain_slot; i++)
		{
			Model random_model = Random(entity_list);

			new_generation.add(random_model);
		}
		
		return new_generation;
	}
	
	//Crossover operator
	private ArrayList<Model> crossOver(Model parent1, Model parent2) throws InterruptedException
	{
       	
		Random rand = new Random();
		
		ArrayList<Model> return_models = new ArrayList<Model>();
		
		Model model_1 = null;
		
		Model model_2 = null;
		
		
		model_1 = deepCopy_Model (parent1);
		//Make the ID different from the parent
		model_1.ID = rand.nextInt(100000);
		
		model_2 = deepCopy_Model (parent2);
		//Make the ID different from the parent
		model_2.ID = rand.nextInt(100000);
		
		//Do cross over here
		ArrayList<Double> extract_p_list = new ArrayList<Double>();
		
		//First, a random extract_p of model_1 is chosen
		for (BehaviorGroup BG : model_1.agents.get(0).behavior_Group)
		{
			extract_p_list.add(BG.extracted_p);
		}
		
		int random_BG1_index = rand.nextInt(extract_p_list.size());
		
		double chosen_p = extract_p_list.get(random_BG1_index);
		
		//boolean can_cross_over = false;
		
		//Second, scan through model_2 to see if the BG with the same 
		// extract_p as model_1 exist

		for(int i = 0; i < model_2.agents.get(0).behavior_Group.size(); i++)
		{
			//Crossover only happens if both model_a and model_b has 
			//behavior group with the same extract_p
			if(chosen_p == model_2.agents.get(0).behavior_Group.get(i).extracted_p)
			{
				Behavior exchange_b1 = new Behavior(), exchange_b2 = new Behavior();
				
				
				if (model_1.agents.get(0).behavior_Group.get(random_BG1_index).behavior_set.size() == 0)
				{
					return_models.add(parent1);
					return_models.add(parent2);
					
					return return_models;
				}
				
				int random_b1_index = rand.nextInt(model_1.agents.get(0).behavior_Group.get(random_BG1_index).behavior_set.size());
				int random_b2_index = 0;
				
				//If behavior is space behavior
				//Crossover between 2 space behavior of the smae segment combination (nearest to desired direction, travel farthest, and nearest to current direction)
				if (model_1.agents.get(0).behavior_Group.get(random_BG1_index).behavior_set.get(random_b1_index).action instanceof SpaceReference_Static)
				{
					return_models.add(parent1);
					return_models.add(parent2);
					
					return return_models;
					/*
					//Crossover between 2 space behaviors
					exchange_b1 = deepCopyBehavior(model_1.agents.get(0).behavior_Group.get(random_BG1_index).behavior_set.get(random_b1_index));
					exchange_b2 = deepCopyBehavior(model_2.agents.get(0).behavior_Group.get(random_BG1_index).behavior_set.get(random_b1_index));
					 */	
				}
				//For other cases, it can switch between 2 behaviors with the same extract property 
				else
				{
					exchange_b1 = deepCopyBehavior(model_1.agents.get(0).behavior_Group.get(random_BG1_index).behavior_set.get(random_b1_index));
					
					if (model_2.agents.get(0).behavior_Group.get(i).behavior_set.size() == 0)
					{
						return_models.add(parent1);
						return_models.add(parent2);
						
						return return_models;
					}
					random_b2_index = rand.nextInt(model_2.agents.get(0).behavior_Group.get(i).behavior_set.size());
					exchange_b2 = deepCopyBehavior(model_2.agents.get(0).behavior_Group.get(i).behavior_set.get(random_b2_index));
				}
				


				if (isBehaviorEqual(exchange_b1, exchange_b2) == false)
				{
					//Shadow copy is good enough here
					//Only need to change behavior group of one agent, all other will get the same change,
					Agent a = model_2.agents.get(0);
					a.behavior_Group.get(i).behavior_set.remove(random_b2_index);
					a.behavior_Group.get(i).behavior_set.add(random_b2_index, exchange_b1);

					a = model_1.agents.get(0);
					a.behavior_Group.get(random_BG1_index).behavior_set.remove(random_b1_index);
					a.behavior_Group.get(random_BG1_index).behavior_set.add(random_b1_index, exchange_b2);

					
					//Get the score for children model
					model_1.fitnessMetric = Main.getFitnessScore(model_1, entity_list, model_1.behavior_Group, model_1.preset_behavior_Group, global_var.simulation_per_generation);
					
					model_2.fitnessMetric = Main.getFitnessScore(model_2, entity_list, model_2.behavior_Group, model_2.preset_behavior_Group, global_var.simulation_per_generation);
					
					ArrayList<Model> parent_child = new ArrayList<>();
					
					parent_child.add(parent1);
					parent_child.add(parent2);
					parent_child.add(model_1);
					parent_child.add(model_2);
					
					Collections.sort(parent_child, new SortbyFitnessMetric());
					
					//Return the best 2 out of 4
					return_models.add(parent_child.get(0));
					return_models.add(parent_child.get(1));
				}
				else
				{
					return_models.add(parent1);
					return_models.add(parent2);
				}
				
			}
			
		}
		
		return return_models;
	}
	
	//Mutate operator
	private Model mutate(Model model1) throws InterruptedException
	{
		Random rand = new Random();
		
		Model chosen_model = deepCopy_Model(model1);
		
		//Make the ID different from the parent
		chosen_model.ID = rand.nextInt(100000);

		ArrayList<Double> filtered_p = new ArrayList<Double>();

		ArrayList<BehaviorTemplate> B_template = new ArrayList<BehaviorTemplate>();


		//Need a deep copy here
		for (BehaviorTemplate b_temp: Main.B_template)
		{
			B_template.add(b_temp);
		}

		for(double j : Main.searchSpace.filter_range_property)
		{
			filtered_p.add(j);
		}
		
		
		//0: add a behavior
		//1: remove a behavior
		//2: modify a behavior
		int random_option = rand.nextInt(3);
		//int random_option = 2;
		
		//0: add a behavior
		if (random_option == 0)
		{
			int random_BG_index = rand.nextInt(chosen_model.agents.get(0).behavior_Group.size());
			
			BehaviorGroup BG = chosen_model.agents.get(0).behavior_Group.get(random_BG_index);
			
			ArrayList<Integer> offset_outcome = new ArrayList<Integer>(Arrays.asList(-1,0,1));
			
			int count_B = 0;
			
			for (BehaviorGroup BG_count : chosen_model.agents.get(0).behavior_Group)
			{			
				count_B += BG_count.behavior_set.size();			
			}

			//Only add new behavior if BG does not have max number of behavior
			if(count_B < global_var.max_behavior)
			{
				
				//Remove all duplicate templates
				//And template with different extract property

				for (Behavior B_chosen : BG.behavior_set)
				{
					//B_template.removeIf(n -> n.ID == B_chosen.ID || n.extract_property != BG.extracted_p);
					B_template.removeIf(n -> n.extract_property != BG.extracted_p);
				}
				
				Collections.shuffle(B_template);

				if (B_template.size() == 0)
				{
					System.out.println("Check GA.java");
				}
				
				BehaviorTemplate B_temp = B_template.get(0);
				//Create a new random behavior for the chosen BG
				Behavior B = new Behavior(B_temp, BG.extracted_p);

				//Add random B to the BG
				BG.behavior_set.add(B);

				if (BG.behavior_set.size() > global_var.max_behavior)
				{
					System.out.println("mutate adds more behavior than max allowed - GA.java mutate");
				}
			}
			else
			{
				chosen_model.agents.get(0).behavior_Group.get(0).extracted_p = -1;
				return chosen_model;
			}
		}
		//1: remove a behavior
		if (random_option == 1)
		{
			int random_BG_index = rand.nextInt(chosen_model.agents.get(0).behavior_Group.size());
			
			BehaviorGroup BG = chosen_model.agents.get(0).behavior_Group.get(random_BG_index);
			
			//Only remove a behavior if the number of behavior is greater than 1
			//we do not want to end up having a BG with no behavior in it
			
			if(BG.behavior_set.size() > 1)
			{
				//Get a random index for B in BG
				int random_B_index = rand.nextInt(BG.behavior_set.size());
				
				int count = 0;
				//Not remove the space behavior
				while (BG.behavior_set.get(random_B_index).action instanceof SpaceReference_Static)
				{
					//Meaning that this BG only have 3 space behavior, and none of them can be deleted
					if (BG.behavior_set.size() <= 3 || count == 10)
					{
						chosen_model.agents.get(0).behavior_Group.get(0).extracted_p = -1;
						return chosen_model;
					}
					
					System.out.println("try to remove space behavior");
					random_B_index = rand.nextInt(BG.behavior_set.size());
					count++;
					
				}
				
				//Remove B
				BG.behavior_set.remove(random_B_index);
				
				if (BG.behavior_set.size() == 0)
				{
					System.out.println("mutate removes all behavior of a BG - GA.java mutate");
				}
			}
			else
			{
				chosen_model.agents.get(0).behavior_Group.get(0).extracted_p = -1;
				return chosen_model;
			}
		}
		//2: modify a behavior
		if (random_option == 2)
		{
			//Chosen an exist random BehaviorGroup
			int random_BG_index = rand.nextInt(chosen_model.agents.get(0).behavior_Group.size());
			
			double chosen_p = chosen_model.agents.get(0).behavior_Group.get(random_BG_index).extracted_p;
			
			
			//Chosen an exist random Behavior
			int random_B_index = rand.nextInt(chosen_model.agents.get(0).behavior_Group.get(random_BG_index).behavior_set.size());
			
			//Shadow copy is good here
			//We want to change the chosen behavior directly
			Behavior B = chosen_model.agents.get(0).behavior_Group.get(random_BG_index).behavior_set.get(random_B_index);
			
			//O: Mutate activation component
			//1: Mutate action component 
			random_option = rand.nextInt(2);
			
			boolean mutate_the_whole_activation = false;
			boolean mutate_the_whole_aciton = false;
			
			//O: Mutate activation component
			if (random_option == 0)
			{
				//Since option 0 makes the activation return weight of 1
				//Mutate it means just give it a random new activation
				//The new activation can be again option 0 activation
				if (B.activation.option == 0)
				{
					//0: mutate the whole activation function
					//1: mutate the weight only
					random_option = rand.nextInt(2);
					random_option = rand.nextInt(1) + 1;
					
					if (random_option == 0)
					{
						mutate_the_whole_activation = true;
						/*
						while (B.activation.option == 0)
						{
							B.activation = new Activation(B.B_template);
						}
						*/
					}
					else if (random_option == 1)
					{
						B.activation.activation_function.weight = Main.searchSpace.activation_weight.get(rand.nextInt(Main.searchSpace.activation_weight.size()));
					}
					
				}
				//Option 1: self activation
				else if (B.activation.checking_value_reference instanceof SelfChecking_Value)
				{
					//0: mutate activation property, also change criteria as well
					//1: mutate criteria
					//2: mutate activation function
					//3: mutate weight
					random_option = rand.nextInt(4);
					random_option = rand.nextInt(3) + 1;
					
					random_option = 0;
					//0: mutate the whole
					if (random_option == 0)
					{
						mutate_the_whole_activation = true;
						//B.activation = new Activation(B.B_template);
					}
					//1: mutate criteria
					else if (random_option == 1)
					{
						B.activation.mutateCriteria(B.activation.extracted_p, B.activation.checking_value_reference);
					}
					//3: mutate activation function
					else if (random_option == 2)
					{
						B.activation.mutateActivationFunction();
					}
					else if (random_option == 3)
					{
						B.activation.activation_function.weight = Main.searchSpace.activation_weight.get(rand.nextInt(Main.searchSpace.activation_weight.size()));
					}
				}
				//Option 2: neighbor check
				else if (B.activation.checking_value_reference instanceof NeighborChecking_Value)
				{
					//0: Mutate the whole activation
					//1: Mutate criteria
					//2: Mutate filter chain
					//3: Mutate null_activation
					//4: Mutate AF
					random_option = rand.nextInt(5);
					random_option = rand.nextInt(4) + 1;
					random_option = 0;
					//0: Mutate criteria
					if (random_option == 0)
					{

						//B.activation = new Activation(B.B_template);
						
					}
					//1: Mutate criteria
					else if (random_option == 1)
					{
						B.activation.mutateCriteria(B.activation.extracted_p, B.activation.checking_value_reference);
					}
					//2: Mutate filter
					else if (random_option == 2)
					{
						NeighborChecking_Value n_c_r = (NeighborChecking_Value) B.activation.checking_value_reference;
						
						//Dummy filter
						Filter f = new Filter();

						n_c_r.filter_chain = f.mutateFilterChain(n_c_r.filter_chain, B.B_template);
 						
						//Only happend if filter_chain is empty and mutation try to remove or modify it.
						if(n_c_r.filter_chain == null)
 						{
							n_c_r.filter_chain = new ArrayList<Filter>();
							chosen_model.agents.get(0).behavior_Group.get(0).extracted_p = -1;
 							return chosen_model;
 						}
 						
					}
					//3: Mutate null_activation
					else if (random_option == 3)
					{
						B.activation.mutateNullActivation();
					}
					//4: Mutate AF
					else if (random_option == 4)
					{
						B.activation.mutateActivationFunction();
					}
					
				}
				//Option 3: space check
				else if (B.activation.checking_value_reference instanceof SpaceChecking_Value)
				{
					//0: Mutate the whole activation
					//1: Mutate criteria
					//2: Mutate action for activation
					//3: Mutate null_activation
					//4: Mutate AF
					random_option = rand.nextInt(5);
					random_option = rand.nextInt(4) + 1;
					
					random_option = 0;
					//0: Mutate criteria
					if (random_option == 0)
					{

						//B.activation = new Activation(B.B_template);
						
					}
					//1: Mutate criteria
					else if (random_option == 1)
					{
						B.activation.mutateCriteria(B.activation.extracted_p, B.activation.checking_value_reference);
					}
					//2: Mutate action for activation
					else if (random_option == 2)
					{
						SpaceReference_Static s_e = (SpaceReference_Static) B.action;
						
						//0: Mutate filter_chain
						//1: Mutate act_on_space_property
						//2: Mutate distance
						random_option = rand.nextInt(3);
						
						if (random_option == 0)
						{
							//Dummy filter
							Filter f = new Filter();

							s_e.filter_chain = f.mutateFilterChain(s_e.filter_chain, B.B_template);

							if (B.action instanceof SpaceReference_Static)
							{
								SpaceReference_Static temp = (SpaceReference_Static) B.action;
								
								temp.filter_chain = s_e.filter_chain;
							}
							
							//Only happen if filter_chain is empty and mutation try to remove or modify it.
							if(s_e.filter_chain == null)
							{
								s_e.filter_chain = new ArrayList<Filter>();
								chosen_model.agents.get(0).behavior_Group.get(0).extracted_p = -1;
								return chosen_model;
							}

						}
						else if (random_option == 1)
						{
							double act_on_space_property = s_e.act_on_space_property;
							do 
							{
								s_e.act_on_space_property = Main.searchSpace.act_on_space_property.get(rand.nextInt(Main.searchSpace.act_on_space_property.size()));
							}while (s_e.act_on_space_property == act_on_space_property);
						}
						else if (random_option == 2)
						{
							if (s_e.heading_option_combination == 0)
							{
								s_e.heading_option_combination = 1;
							}
							else if (s_e.heading_option_combination == 1)
							{
								s_e.heading_option_combination = 0;
							}
						}
						
						//need to mutate the action as well the make them the same
						B.action = new SpaceReference_Static(0,s_e.filter_chain,s_e.act_on_empty_space, s_e.act_on_space_property, s_e.heading_option_combination, s_e.extract_property);
					}
					//3: Mutate null_activation
					else if (random_option == 3)
					{
						B.activation.mutateNullActivation();
					}
					//4: Mutate AF
					else if (random_option == 4)
					{
						B.activation.mutateActivationFunction();
					}
					
				}
			}
			//1: Mutate action component
			else if (random_option == 1)
			{
				if (B.action instanceof SelfReference || B.action instanceof NeighborReference)
				{
					//0: Mutate offset
					//1: Mutate filter_chain of action
					random_option = rand.nextInt(2);
					
					//0: mutate offset
					if (random_option == 0)
					{
						
						double extract_p = chosen_model.agents.get(0).behavior_Group.get(random_BG_index).extracted_p;
						
						//Numeric 
						if (Main.searchSpace.numerical_property.contains(extract_p))
						{
							ArrayList<Double> offset_list = Main.searchSpace.getOffsetList(extract_p);
							
							//The offset is changed based on extract property
							B.action.offset = offset_list.get(rand.nextInt(offset_list.size()));
						}
						else
						{
							chosen_model.agents.get(0).behavior_Group.get(0).extracted_p = -1;
							return chosen_model;
						}
						
					}
					//1: mutate filter_chain of action
					else if (random_option == 1)
					{
						
						//if activation is not get reference from neighbor
						if ((B.activation.checking_value_reference instanceof NeighborChecking_Value) == false)
						{
							//Only get reference from neighbor has filter
							if (B.action instanceof NeighborReference)
							{
								NeighborReference n_r = (NeighborReference) B.action;
								
								
								//Dummy filter
								Filter f = new Filter();

								n_r.filter_chain = f.mutateFilterChain(n_r.filter_chain, B.B_template);
								
								//Only happen if filter_chain is empty and mutation try to remove or modify it.
								if(n_r.filter_chain == null)
								{
									n_r.filter_chain = new ArrayList<Filter>();
									chosen_model.agents.get(0).behavior_Group.get(0).extracted_p = -1;
									return chosen_model;
								}
							}

						}
						//if activation component already check neighbor 
						//No need to mutate filter for action component.
						else
						{
							if (B.action instanceof NeighborReference)
							{
								//System.out.println("both activation and action check reference from neighbor. Mutate.java");
							}

						}
						
					
					}
				}
				//For space behavior
				//We only care FOV_distance_option
				else if (B.action instanceof SpaceReference_Static)
				{
					SpaceReference_Static s_e = (SpaceReference_Static) B.action;
					
					//0: Mutate filter_chain
					//1: Mutate act_on_space_property
					//2: Mutate distance
					random_option = rand.nextInt(3);
					
					if (random_option == 0)
					{

						//Dummy filter
						Filter f = new Filter();

						s_e.filter_chain = f.mutateFilterChain(s_e.filter_chain, B.B_template);

						if (B.activation.checking_value_reference instanceof SpaceChecking_Value)
						{
							SpaceChecking_Value temp = (SpaceChecking_Value) B.activation.checking_value_reference;
							
							temp.action_for_activation_static.filter_chain = s_e.filter_chain;
						}
						
						//Only happen if filter_chain is empty and mutation try to remove or modify it.
						if(s_e.filter_chain == null)
						{
							s_e.filter_chain = new ArrayList<Filter>();
							chosen_model.agents.get(0).behavior_Group.get(0).extracted_p = -1;
							return chosen_model;
						}

					}
					else if (random_option == 1)
					{
						double act_on_space_property = s_e.act_on_space_property;
						do 
						{
							s_e.act_on_space_property = Main.searchSpace.act_on_space_property.get(rand.nextInt(Main.searchSpace.act_on_space_property.size()));
						}while (s_e.act_on_space_property == act_on_space_property);
					}
					else if (random_option == 2)
					{
						if (s_e.heading_option_combination == 0)
						{
							s_e.heading_option_combination = 1;
						}
						else if (s_e.heading_option_combination == 1)
						{
							s_e.heading_option_combination = 0;
						}
					}
					
					if (B.activation.checking_value_reference instanceof SpaceChecking_Value)
					{
						SpaceChecking_Value temp = (SpaceChecking_Value) B.activation.checking_value_reference;
						
						temp.action_for_activation_static = new SpaceReference_Static(0,s_e.filter_chain,s_e.act_on_empty_space, s_e.act_on_space_property, s_e.heading_option_combination, s_e.extract_property);
					}
					else if (B.activation.checking_value_reference instanceof NeighborChecking_Value)
					{
						System.out.println("Activation has neighbor checking while  Action gets reference from spaec. GA.java");
						System.out.println(B.activation.checking_value_reference.toString());
					}
				}
			}
		}
		
		//Need to run simulation to see if mutate model is better than original one
		//Get the score for children model
		chosen_model.fitnessMetric = Main.getFitnessScore(chosen_model, entity_list, chosen_model.behavior_Group, chosen_model.preset_behavior_Group , global_var.simulation_per_generation);

		if (chosen_model.fitnessMetric > model1.fitnessMetric)
		{
			return chosen_model;
		}
		else
		{
			chosen_model.agents.get(0).behavior_Group.get(0).extracted_p = -1;
			return chosen_model;
		}

	}
	
	//Create random model
	private Model Random(ArrayList<ArrayList<Entity>> entity_list_add)
	{
		
		ArrayList<BehaviorGroup> BG_preset = new ArrayList<BehaviorGroup>();

		String s = "";

		BG_preset = Main.addModelFromText(s);
		
		ArrayList<BehaviorGroup> BG_set = new ArrayList<BehaviorGroup>();
		
		ArrayList<Entity> entity_list_temp = new ArrayList<Entity>();
		
		BG_set = Main.createRandomBG();
			
		
		for (Entity e : entity_list_add.get(0))
		{
			//Agent list need to be deep copy
			if (e instanceof Agent)
			{	
				Agent a = new Agent(((Agent) e).position, ((Agent) e).heading.value, ((Agent) e).speed.value, 1.0);

				if (a.type.value == 1.0)
				{
					a.addBehavior(BG_preset);
				}
				else
				{
					a.addBehavior(BG_set);
				}
				
				
				entity_list_temp.add(a);
			}
			//For now, only agent has behavior
			else
			{
				entity_list_temp.add(e);
			}
		}
		
		ArrayList<Zone> zone_set = Main.setZone();
		ArrayList<agentGenerator> a_gen_set = Main.setAgentGenerator();
		
		Model random = new Model(entity_list_temp, zone_set, a_gen_set, BG_set, BG_preset);
		
		return random;
	}
	
	public boolean isModelEqual(Model m1, Model m2)
	{	
		if (m1.behavior_Group.size() == m2.behavior_Group.size())
		{
			for (int i = 0; i < m1.behavior_Group.size(); i++)
			{
				//Check extract property of each behavior group in both models
				if (m1.behavior_Group.get(i).extracted_p == m2.behavior_Group.get(i).extracted_p)
				{
					if (m1.behavior_Group.get(i).behavior_set.size() == m2.behavior_Group.get(i).behavior_set.size())
					{
						for (int j = 0; j < m1.behavior_Group.get(i).behavior_set.size(); j++)
						{
							//Check each component in each behavior of 2 model
							Behavior B1 = m1.behavior_Group.get(i).behavior_set.get(j);
							Behavior B2 = m2.behavior_Group.get(i).behavior_set.get(j);
						
							if (isBehaviorEqual(B1, B2) == false)
							{
								return false;
							}
							else
							{
								return true;
							}
						}
					}
					else
					{
						return false;
					}
				}
				else
				{
					return false;
				}
			}
		}
		else
		{
			return false;
		}
		
		return true;
	}
	
	public boolean isBehaviorEqual(Behavior b1, Behavior b2)
	{
		//Check each component in each behavior of 2 model
		Behavior B1 = b1;
		Behavior B2 = b2;

		if (B1.activation.checking_value_reference.getClass().equals(B2.activation.checking_value_reference.getClass()) == false)
		{
			return false;
		}
		else 
		{
			//Check activation criteria
			//Check if they are the same type
			if (B1.activation.criteria.getClass().equals(B1.activation.criteria.getClass()))
			{
				//If they have the same type, check the criteria specification
				if (B1.activation.criteria instanceof RangeCriteria)
				{
					RangeCriteria rc1 = (RangeCriteria) B1.activation.criteria;
					RangeCriteria rc2 = (RangeCriteria) B2.activation.criteria;

					//If one of the range is not matched
					if (rc1.activation_lowerRange != rc2.activation_lowerRange
							&& rc1.activation_upperRange != rc2.activation_upperRange)
					{
						return false;
					}
				}
				else if (B1.activation.criteria instanceof CategoryCriteria)
				{
					CategoryCriteria cc1 = (CategoryCriteria) B1.activation.criteria;
					CategoryCriteria cc2 = (CategoryCriteria) B2.activation.criteria;

					if (cc1.check_set.size() == cc2.check_set.size())
					{
						for (int k = 0; k < cc1.check_set.size(); k++)
						{
							if (cc1.check_set.get(k) != cc2.check_set.get(k))
							{
								return false;
							}
						}
					}
					else
					{
						return false;
					}
				}

				//Checking activation function
				if (B1.activation.activation_function instanceof Activation_function_binary 
						&&
						B2.activation.activation_function instanceof Activation_function_binary	)
				{
					Activation_function_binary afb1 = (Activation_function_binary)B1.activation.activation_function;
					Activation_function_binary afb2 = (Activation_function_binary)B2.activation.activation_function;

					if (afb1.inside != afb2.inside)
					{
						return false;
					}
				}
				else if (B1.activation.activation_function instanceof Activation_function_linear 
						&&
						B2.activation.activation_function instanceof Activation_function_linear	)
				{
					Activation_function_linear afl1 = (Activation_function_linear)B1.activation.activation_function;
					Activation_function_linear afl2 = (Activation_function_linear)B2.activation.activation_function;

					if (afl1.increase != afl2.increase)
					{
						return false;
					}

					if (afl1.slope != afl2.slope)
					{
						return false;
					}

				}
				//Type = 0 means default activation function
				else if (B1.activation.activation_function.type == 0)
				{

				}
				else
				{
					return false;
				}

				//Neighbor check has filter chain
				if (B1.activation.checking_value_reference instanceof NeighborChecking_Value)
				{
					NeighborChecking_Value n_c_v1 = (NeighborChecking_Value) B1.activation.checking_value_reference;
					NeighborChecking_Value n_c_v2 = (NeighborChecking_Value) B2.activation.checking_value_reference;
					
					if (n_c_v1.filter_chain.size() == n_c_v2.filter_chain.size())
					{
						for (int k = 0; k < n_c_v1.filter_chain.size(); k++)
						{
							Filter f1 = n_c_v1.filter_chain.get(k);
							Filter f2 = n_c_v2.filter_chain.get(k);

							if (f1.filtered_p == f2.filtered_p)
							{
								if (f1 instanceof Filter_ranged && f2 instanceof Filter_ranged)
								{
									Filter_ranged fr1 = (Filter_ranged) f1;
									Filter_ranged fr2 = (Filter_ranged) f2;

									if (fr1.lowerRange == fr2.lowerRange && fr1.upperRange == fr2.upperRange)
									{
										if (fr1.filtered_set.size() == fr2.filtered_set.size())
										{
											for (int l = 0; l < fr1.filtered_set.size(); l++)
											{
												Double d1 = fr1.filtered_set.get(l);
												Double d2 = fr2.filtered_set.get(l);

												if (d1.doubleValue() != d2.doubleValue())
												{
													return false;
												}
											}
										}
										else
										{
											return false;
										}
									}
									else
									{
										return false;
									}
								}
								else if (f1 instanceof Filter_method && f2 instanceof Filter_method)
								{
									Filter_method fr1 = (Filter_method) f1;
									Filter_method fr2 = (Filter_method) f2;

									if (fr1.filtered_p == fr2.filtered_p)
									{
										if (fr1.method != fr2.method)
										{
											return false;
										}
									}
									else
									{
										return false;
									}
								}
								else
								{
									return false;
								}
							}
							else
							{
								return false;
							}
						}
					}
					else
					{
						return false;
					}
				}
				
				//Space check has filter chain
				if (B1.activation.checking_value_reference instanceof SpaceChecking_Value)
				{
					SpaceChecking_Value s_c_v1 = (SpaceChecking_Value) B1.activation.checking_value_reference;
					SpaceChecking_Value s_c_v2 = (SpaceChecking_Value) B2.activation.checking_value_reference;
					
					SpaceReference_Static s_e_1 = (SpaceReference_Static) s_c_v1.action_for_activation_static;
					SpaceReference_Static s_e_2 = (SpaceReference_Static) s_c_v2.action_for_activation_static;
					
					if (s_e_1.filter_chain.size() == s_e_2.filter_chain.size())
					{
						for (int k = 0; k < s_e_1.filter_chain.size(); k++)
						{
							Filter f1 = s_e_1.filter_chain.get(k);
							Filter f2 = s_e_2.filter_chain.get(k);

							if (f1.filtered_p == f2.filtered_p)
							{
								if (f1 instanceof Filter_ranged && f2 instanceof Filter_ranged)
								{
									Filter_ranged fr1 = (Filter_ranged) f1;
									Filter_ranged fr2 = (Filter_ranged) f2;

									if (fr1.lowerRange == fr2.lowerRange && fr1.upperRange == fr2.upperRange)
									{
										if (fr1.filtered_set.size() == fr2.filtered_set.size())
										{
											for (int l = 0; l < fr1.filtered_set.size(); l++)
											{
												Double d1 = fr1.filtered_set.get(l);
												Double d2 = fr2.filtered_set.get(l);

												if (d1.doubleValue() != d2.doubleValue())
												{
													return false;
												}
											}
										}
										else
										{
											return false;
										}
									}
									else
									{
										return false;
									}
								}
								else if (f1 instanceof Filter_method && f2 instanceof Filter_method)
								{
									Filter_method fr1 = (Filter_method) f1;
									Filter_method fr2 = (Filter_method) f2;

									if (fr1.filtered_p == fr2.filtered_p)
									{
										if (fr1.method != fr2.method)
										{
											return false;
										}
									}
									else
									{
										return false;
									}
								}
								else
								{
									return false;
								}
							}
							else
							{
								return false;
							}
						}
					}
					else
					{
						return false;
					}
					
					if (s_e_1.act_on_empty_space != s_e_2.act_on_empty_space)
					{
						return false;
					}
					
					if (s_e_1.act_on_space_property != s_e_2.act_on_space_property)
					{
						return false;
					}
					
					if (s_e_1.heading_option_combination != s_e_2.heading_option_combination)
					{
						return false;
					}
					
					if (B1.action.offset != B2.action.offset)
					{
						return false;
					}
					
				}

			}

		}


		//Check action equally here

		if (B1.action instanceof SelfReference && B2.action instanceof SelfReference)
		{
			if (B1.action.extract_property == B2.action.extract_property)
			{
				if (B1.action.offset == B2.action.offset)
				{
					return true;
				}
				else
				{
					return false;
				}
			}
			else
			{
				return false;
			}
		}
		else if (B1.action instanceof NeighborReference && B2.action instanceof NeighborReference)
		{
			NeighborReference action_B1 = (NeighborReference) B1.action;
			NeighborReference action_B2 = (NeighborReference) B2.action;

			if (action_B1.filter_chain.size() == action_B2.filter_chain.size())
			{
				for (int k = 0; k < action_B2.filter_chain.size(); k++)
				{
					Filter f1 = action_B1.filter_chain.get(k);
					Filter f2 = action_B2.filter_chain.get(k);

					if (f1.filtered_p == f2.filtered_p)
					{
						if (f1 instanceof Filter_ranged && f2 instanceof Filter_ranged)
						{
							Filter_ranged fr1 = (Filter_ranged) f1;
							Filter_ranged fr2 = (Filter_ranged) f2;

							if (fr1.lowerRange == fr2.lowerRange && fr1.upperRange == fr2.upperRange)
							{
								if (fr1.filtered_set.size() == fr2.filtered_set.size())
								{
									for (int l = 0; l < fr1.filtered_set.size(); l++)
									{
										if (fr1.filtered_set.get(l).doubleValue() != fr2.filtered_set.get(l).doubleValue())
										{
											return false;
										}
									}
								}
								else
								{
									return false;
								}
							}
							else
							{
								return false;
							}
						}
						else if (f1 instanceof Filter_method && f2 instanceof Filter_method)
						{
							Filter_method fr1 = (Filter_method) f1;
							Filter_method fr2 = (Filter_method) f2;

							if (fr1.filtered_p == fr2.filtered_p)
							{
								if (fr1.method != fr2.method)
								{
									return false;
								}
							}
							else
							{
								return false;
							}
						}
						else
						{
							return false;
						}
					}
					else
					{
						return false;
					}
				}
			}
			else
			{
				return false;
			}

			if (B1.action.offset != B2.action.offset)
			{
				return false;
			}
		}
		else if (B1.action instanceof SpaceReference_Static && B2.action instanceof SpaceReference_Static)
		{
			SpaceReference_Static s_r1 =(SpaceReference_Static) B1.action;
			SpaceReference_Static s_r2 = (SpaceReference_Static) B2.action;
			
			if (s_r1.act_on_empty_space != s_r2.act_on_empty_space)
			{
				return false;
			}
			
			if (s_r1.act_on_space_property != s_r2.act_on_space_property)
			{
				return false;
			}
			
			if (s_r1.heading_option_combination != s_r2.heading_option_combination)
			{
				return false;
			}
			
			if (B1.action.offset != B2.action.offset)
			{
				return false;
			}
			
			//Only return true if none of above condition is false;
			return true;
		}
		//B1 and B2 does have the same action type
		else
		{
			return false;
		}

	
		return true;
	}
	
	//Check at structure level only
	//If they have the same model structure, and different from parameters
	//This function will return true
	public boolean isModelStructureEqual(Model m1, Model m2)
	{	
		if (m1.behavior_Group.size() == m2.behavior_Group.size())
		{
			for (int i = 0; i < m1.behavior_Group.size(); i++)
			{
				//Check extract property of each behavior group in both models
				if (m1.behavior_Group.get(i).extracted_p == m2.behavior_Group.get(i).extracted_p)
				{
					if (m1.behavior_Group.get(i).behavior_set.size() == m2.behavior_Group.get(i).behavior_set.size())
					{
						for (int j = 0; j < m1.behavior_Group.get(i).behavior_set.size(); j++)
						{
							//Check each component in each behavior of 2 model
							Behavior B1 = m1.behavior_Group.get(i).behavior_set.get(j);
							Behavior B2 = m2.behavior_Group.get(i).behavior_set.get(j);
							
							if (B1.activation.option != B2.activation.option )
							{
								return false;
							}
							
							//Check action equally here
							if (B1.action.getClass().equals(B2.action.getClass()) == false)
							{
								return false;
							}
						}
					}
					else
					{
						return false;
					}
				}
				else
				{
					return false;
				}
			}
		}
		else
		{
			return false;
		}
		
		return true;
	}
	
	public Model deepCopy_Model (Model model1)
	{	
		
		ArrayList<BehaviorGroup> copy_BG_set = new ArrayList<BehaviorGroup>();
		ArrayList<BehaviorGroup> copy_BG_preset = new ArrayList<BehaviorGroup>();
		
		ArrayList<Entity> entities = new ArrayList<Entity>();
		
		//Copy behavior group
		for (BehaviorGroup BG : model1.behavior_Group)
		{			
			BehaviorGroup copy_BG = new BehaviorGroup(BG.extracted_p);
			
			//Copy each behavior in behavior group
			for (Behavior B : BG.behavior_set)
			{
				Behavior copy_B = deepCopyBehavior(B);
				
				copy_BG.behavior_set.add(copy_B);
			}
			
			copy_BG_set.add(copy_BG);
		}
		
		//Copy preset/-behavior group
		for (BehaviorGroup preset_BG : model1.preset_behavior_Group)
		{			
			BehaviorGroup preset_copy_BG = new BehaviorGroup(preset_BG.extracted_p);

			//Copy each behavior in behavior group
			for (Behavior B : preset_BG.behavior_set)
			{
				Behavior preset_copy_B = deepCopyBehavior(B);

				preset_copy_BG.behavior_set.add(preset_copy_B);
			}

			copy_BG_preset.add(preset_copy_BG);
		}
				
		//Create a random initial set up for agent
		if (global_var.init_agent.equals("random"))
		{
			for (int i = 0; i < global_var.num_of_agents; i++)
			{
				Agent a = new Agent(global_var.init_agent, i, entities);
				
				a.addConstraint(Main.constraint_set);
				
				if (a.type.value == 1.1)
				{
					a.addBehavior(copy_BG_preset);
				}
				else
				{
					a.addBehavior(copy_BG_set);
				}
				
				entities.add(a);
			}

		}
		else if (global_var.init_agent.equals("hardcode"))
		{
			Position pos = new Position(35 , 129);                                                                            
			Agent agent1 = new Agent(pos, 0, 2, 1.0);
			agent1.addBehavior(copy_BG_set);
			agent1.addConstraint(Main.constraint_set);
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
			
			
			pos = new Position(35, 141);
			Agent agent3 = new Agent(pos, 0, 2, 1.0);
			agent3.addBehavior(copy_BG_set);
			agent3.addConstraint(Main.constraint_set);
			// agent3.property_set.get(0).value = 30;
			entities.add(agent3);

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
			
			pos = new Position(10, 10);
			Agent agent2 = new Agent(pos, 0, 0, 1.0);
			agent2.addConstraint(Main.constraint_set);
			agent2.check = false;
			//agent2.addBehavior(behavior_Group);
			// agent2.property_set.get(0).value = 45;
			entities.add(agent2);
		}
		
		
		//Add hard code obstacle to entities here
		ArrayList<Obstacle> ob_set = Main.setHardcodeObstacle();
		for (Obstacle o: ob_set)
		{
			entities.add(o);
		}
		
		//Add hard code goal to entities here
		ArrayList<Goal> goal_set = Main.setHardcodeGoal();
		for (Goal g: goal_set)
		{
			entities.add(g);
		}
		
		//Add hard code zone here
		ArrayList<Zone> zones = new ArrayList<Zone>();
		ArrayList<Zone> zone_set = Main.setZone();
		
		for (Zone z: zone_set)
		{
			zones.add(z);
		}
		
		ArrayList<agentGenerator> a_gen_set = Main.setAgentGenerator();
		
		Model copy_model = new Model(entities, zones, a_gen_set, copy_BG_set, copy_BG_preset);
		
		
		copy_model.age = model1.age;
		
		copy_model.ID = model1.ID;
		
		return copy_model;
		
		
	}
	
	public Behavior deepCopyBehavior(Behavior B)
	{
		
		ArrayList<Filter> fc_activation = new ArrayList<Filter>();
		
		Activation activation = new Activation();
		
		Activation_function AF = new Activation_function();
				
		//Activation function
		
		//Type 1: Binary
		if (B.activation.activation_function instanceof Activation_function_binary)
		{
			Activation_function_binary afb = (Activation_function_binary) B.activation.activation_function;
			
			AF = new Activation_function_binary(afb.weight, afb.inside);
		}
		//Type 2: Linear
		else if (B.activation.activation_function instanceof Activation_function_linear)
		{
			Activation_function_linear afl = (Activation_function_linear) B.activation.activation_function;
			
			AF = new Activation_function_linear(afl.slope, afl.increase);
		}
		//Type 0: Default activation function
		else
		{
			AF = new Activation_function(0,AF.weight);	
		}
		
		//For activation option
		//option = 0: always activate
		if(B.activation.option == 0)
		{
			activation = new Activation(AF);
		}
		//option = 1:  self checking activate
		else if(B.activation.checking_value_reference instanceof SelfChecking_Value)
		{	
			
			if (B.activation.criteria instanceof RangeCriteria)
			{
				RangeCriteria rc = (RangeCriteria) B.activation.criteria;
				activation = new Activation(B.activation.extracted_p, rc.activation_lowerRange, rc.activation_upperRange, AF);
			}
			else if (B.activation.criteria instanceof CategoryCriteria)
			{
				CategoryCriteria cc = (CategoryCriteria) B.activation.criteria;
				activation = new Activation(B.activation.extracted_p, cc.check_set, AF);
			}
					
		}
		//option = 2:  neighbor checking activate
		else if(B.activation.checking_value_reference instanceof NeighborChecking_Value)
		{
			NeighborChecking_Value n_c_v = (NeighborChecking_Value) B.activation.checking_value_reference;
			
			fc_activation = deepCopyFilterChain(n_c_v.filter_chain);

			if (B.activation.criteria instanceof RangeCriteria)
			{
				RangeCriteria rc = (RangeCriteria) B.activation.criteria;
				activation = new Activation(fc_activation, B.activation.extracted_p, rc.activation_lowerRange, rc.activation_upperRange, n_c_v.null_activation, AF);
			}
			else if (B.activation.criteria instanceof CategoryCriteria)
			{
				CategoryCriteria cc = (CategoryCriteria) B.activation.criteria;
				activation = new Activation(fc_activation, B.activation.extracted_p, cc.check_set, n_c_v.null_activation, AF);
			}
			
		}
		//option = 3: space checking activate
		else if (B.activation.checking_value_reference instanceof SpaceChecking_Value)
		{
			SpaceChecking_Value s_c_v = (SpaceChecking_Value) B.activation.checking_value_reference;
			
			//Take acre action part first
			SpaceReference_Static action_of_activaiton = (SpaceReference_Static) s_c_v.action_for_activation_static;
			
			//Action step
			ArrayList<Filter> fc_action = new ArrayList<Filter>();
			
			fc_action = deepCopyFilterChain(action_of_activaiton.filter_chain);
			
			SpaceReference_Static action_for_activaiton = new SpaceReference_Static(0,fc_action, action_of_activaiton.act_on_empty_space, action_of_activaiton.act_on_space_property, action_of_activaiton.heading_option_combination, action_of_activaiton.extract_property);
			
			if (B.activation.criteria instanceof RangeCriteria)
			{
				RangeCriteria rc = (RangeCriteria) B.activation.criteria;
				activation = new Activation(B.activation.extracted_p, action_for_activaiton, rc.activation_lowerRange, rc.activation_upperRange, s_c_v.null_activation, AF);
			}
			
		}
		
		Behavior copy_B = null;
		
		if (B.action instanceof SelfReference)
		{
			Action action = new SelfReference(B.action.offset, B.action.extract_property);
			
			copy_B = new Behavior(activation, action);
		}
		else if (B.action instanceof NeighborReference)
		{
			NeighborReference n_r = (NeighborReference) B.action;
			
			//Action step
			ArrayList<Filter> fc_action = new ArrayList<Filter>();
			
			fc_action = deepCopyFilterChain(n_r.filter_chain);
			
			Action action = new NeighborReference(B.action.offset, fc_action, B.action.extract_property);
			copy_B = new Behavior(activation, action);
			
		}
		else if (B.action instanceof SpaceReference_Static)
		{
			SpaceReference_Static action_of_B = (SpaceReference_Static) B.action;
			
			//Action step
			ArrayList<Filter> fc_action = new ArrayList<Filter>();
			
			fc_action = deepCopyFilterChain(action_of_B.filter_chain);
			
			Action action = new SpaceReference_Static(0,fc_action, action_of_B.act_on_empty_space, action_of_B.act_on_space_property, action_of_B.heading_option_combination, action_of_B.extract_property);
			copy_B = new Behavior(activation, action);
		}
		else
		{
			System.out.println("Action component is not belong to any pre defined one");
		}
		
		copy_B.simplify_check = B.simplify_check;
		
		copy_B.B_template = B.B_template;
		
		copy_B.ID = B.ID;
		
		return copy_B;
	}
	
	
	public ArrayList<Filter> deepCopyFilterChain(ArrayList<Filter> fc)
	{
		ArrayList<Filter> copy_fc = new ArrayList<Filter>();
	
		for (Filter f : fc)
		{
			//3 type of filters
			//Range and method filter
			//0: range
			if (f.type == 0)
			{
				//Numeric property
				if (Main.searchSpace.numerical_property.contains(f.filtered_p))
				{
					Filter_ranged fr = (Filter_ranged) f;
					copy_fc.add(new Filter_ranged(fr.filtered_p, fr.lowerRange, fr.upperRange,0));
				}
				//Category property
				else
				{
					Filter_ranged fr = (Filter_ranged) f;
					copy_fc.add(new Filter_ranged(fr.filtered_p, fr.filtered_set,0));
					
					if (fr.filtered_set.size() == 0)
					{
						System.out.println ("The set is empty GA.java");
					}
				}
			}
			//1: range for space
			else if (f.type == 1)
			{

				Filter_ranged fr = (Filter_ranged) f;
				copy_fc.add(new Filter_ranged(fr.filtered_p, fr.lowerRange, fr.upperRange,1));
			}
			//1: method
			else if (f.type == 2)
			{
				Filter_method fm = (Filter_method) f;
				copy_fc.add(new Filter_method(fm.filtered_p, fm.method));
			}
			else
			{
				System.out.println ("Filter type is return different from 1 or 2 GA.java deep_copy model");
			}
		}
		
		return copy_fc;
	}
	
	public Filter deepCopyFilter(Filter f)
	{
		Filter copy_f = new Filter();
		
		if (f.type == 0)
		{
			//Numeric property
			if (Main.searchSpace.numerical_property.contains(f.filtered_p))
			{
				Filter_ranged fr = (Filter_ranged) f;
				Filter_ranged fr_return = new Filter_ranged(fr.filtered_p, fr.lowerRange, fr.upperRange,0);
				fr_return.simplify_check = f.simplify_check;
				
				return fr_return;
			}
			//Category property
			else
			{
				Filter_ranged fr = (Filter_ranged) f;
				
				if (fr.filtered_set.size() == 0)
				{
					System.out.println ("The set is empty - Deepcopy Filter");
				}
				
				Filter_ranged fr_return = new Filter_ranged(fr.filtered_p, fr.filtered_set,0);
				fr_return.simplify_check = f.simplify_check;
				
				return fr_return;
				
			}
		}
		//1. Range for space
		else if (f.type == 1)
		{
			Filter_ranged fr = (Filter_ranged) f;
			Filter_ranged fr_return = new Filter_ranged(fr.filtered_p, fr.lowerRange, fr.upperRange,0);
			fr_return.simplify_check = f.simplify_check;
			
		}
		//1: method
		else if (f.type == 2)
		{
			Filter_method fm = (Filter_method) f;
			Filter_method fr_return =new Filter_method(fm.filtered_p, fm.method);
			fr_return.simplify_check = f.simplify_check;
			
			return fr_return;
		}
		else
		{
			System.out.println ("Filter type is return different from 1 or 2 GA.java deep_copy model");
		}
		
		return copy_f;
	}
	
	public double getRandomDouble(double min, double max)
	{
		
		Random rand;
		
		if (Main.global_var.random_no_seed == true)
		{
			rand = new Random();  
		}
		else
		{
			rand = new Random(Main.global_var.random_seed);  
		}
		
		double randomValue = min + (max - min) * rand.nextDouble();
		
	    return randomValue;
	}

} 

class SortbyFitnessMetric implements Comparator<Model> 
{ 
    // Used for sorting in decending order of 
    // roll number 
    public int compare(Model a, Model b) 
    { 
    	if (a.fitnessMetric - b.fitnessMetric < 0)
    	{
    		return 1;
    	}
    	else if (a.fitnessMetric - b.fitnessMetric > 0)
    	{
    		return -1;
    	}
    	else
    	{
    		return 0;
    	}
    } 
} 
