package core;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.Random;

import Goal.Goal;
import Goal.Goal_point;
import agents.Agent;
import agents.Position;
import agents.agentGenerator;
import behavior.Behavior;
import behavior.BehaviorGroup;
import entities.Entity;
import obstacles.Obstacle;
import obstacles.Obstacle_circle;
import searchMethod.GeneticAlgorithm;
import zones.Zone;
import zones.Zone_rectangle;

public class model_list 
{
	ArrayList<Model> model_database = new ArrayList<Model>();
	ArrayList<model_template> model_template = new ArrayList<model_template>();
	
	
	public model_list()
	{
		
	}
	
	public model_list(ArrayList<Model> model_list)
	{
		for (Model m : model_list)
		{
			model_database.add(m);
		}
	}
	
	
	public void classify_behavior_purpose(ArrayList<model_list> model_list_all_population) throws InterruptedException, IOException
	{
		GeneticAlgorithm GA_dummy = new GeneticAlgorithm();
		
		ArrayList<Model> obstacle_avoidance_model_list = new ArrayList<Model>();
		ArrayList<Model> follow_leader_model_list = new ArrayList<Model>();
		ArrayList<Model> controlAngleTurn_model_list = new ArrayList<Model>();
		ArrayList<Model> personalSpace_model_list = new ArrayList<Model>();
		ArrayList<Model> speed_model_list = new ArrayList<Model>();;
		
		int count = 0;
		double thredhold = 0.001;
		
		ArrayList<ArrayList<Entity>> entity_list = Main.createEntityList(1);
		
		System.out.println("There are total of:" + model_list_all_population.size() + "model list");
		int count_model_list = 0;
		//For each population
		for (model_list ml : model_list_all_population)
		{
			System.out.println("-----------------Processing model list#-----------------------" + count_model_list);
			System.out.println("Model list size: " + ml.model_database.size());
			count_model_list++;
			//For each model in a population
			for (Model m: ml.model_database)
			{
				
				//Copy model first
				
				System.out.println("Model" + count);
				count++;
				
				Model original_model = GA_dummy.deepCopy_Model(m);
				
				ArrayList<BehaviorGroup> starting_BG = new ArrayList<BehaviorGroup>();
				//Start with only speed B, then add other behavior one by one and approach
				for (BehaviorGroup BG: original_model.behavior_Group)
				{
					if (BG.extracted_p == 3.0)
					{
						starting_BG.add(BG);
					}
				}
				
				for (BehaviorGroup BG: original_model.behavior_Group)
				{
					if (BG.extracted_p != 3.0)
					{
						
						for (int i = 0; i < BG.behavior_set.size(); i++)
						{
													
							Behavior tested_behavior = GA_dummy.deepCopyBehavior(BG.behavior_set.get(i));
							
							BehaviorGroup tested_BG = new BehaviorGroup(BG.extracted_p);
							
							tested_BG.behavior_set.add(tested_behavior);
							
							starting_BG.add(tested_BG);
							
							double obstacleAvoidance_fitnessScore_Average = 0;
							double follow_leader_fitnessScore_Average = 0;
							double exceed_AngleTurn_fitnessScore = 0;
							double personalSpace_fitnessScore = 0;
							
							Model testing_model = setEntityPropertyValue(entity_list, starting_BG);
							
							for (int j = 0; j < Main.global_var.simulation_per_generation; j++)
							{
								testing_model = setEntityPropertyValue(entity_list, starting_BG);
								testing_model.runSimulation(1, 0);
								
								
								obstacleAvoidance_fitnessScore_Average += testing_model.obstacleAvoidance_fitnessScore ;
								follow_leader_fitnessScore_Average += testing_model.follow_leader_fitnessScore;
								exceed_AngleTurn_fitnessScore += testing_model.exceed_AngleTurn_fitnessScore;
								personalSpace_fitnessScore += testing_model.personalSpace_fitnessScore;
								//original_model.goals = Main.setHardcodeGoal();
								//original_model.obstacles = Main.setHardcodeObstacle();
							}	

							obstacleAvoidance_fitnessScore_Average = obstacleAvoidance_fitnessScore_Average/Main.global_var.simulation_per_generation;
							follow_leader_fitnessScore_Average = follow_leader_fitnessScore_Average/Main.global_var.simulation_per_generation;;
							exceed_AngleTurn_fitnessScore = exceed_AngleTurn_fitnessScore/Main.global_var.simulation_per_generation;
							personalSpace_fitnessScore = personalSpace_fitnessScore/Main.global_var.simulation_per_generation;
							
							//Find which fitness function is remain high
							//Meaning the added behavior is needed for the certain goal
							//Since this approach tests individual behavior
							//After finding a good behavior -> add it right to the model and move on the next B
							if (obstacleAvoidance_fitnessScore_Average >= thredhold)
							{
								Model add_obstalce_avoidance_model = setEntityPropertyValue(entity_list, starting_BG);
								obstacle_avoidance_model_list.add(add_obstalce_avoidance_model);								
							}
							
							if (follow_leader_fitnessScore_Average >= thredhold)
							{		
								Model add_follow_leader_model = setEntityPropertyValue(entity_list, starting_BG);
								follow_leader_model_list.add(add_follow_leader_model);
							}
							
							if (exceed_AngleTurn_fitnessScore >= thredhold)
							{

								Model add_controlAngleTurn_model = setEntityPropertyValue(entity_list, starting_BG);
								controlAngleTurn_model_list.add(add_controlAngleTurn_model);
							}
							
							if (personalSpace_fitnessScore >= thredhold)
							{
								Model add_personalSpace_model = setEntityPropertyValue(entity_list, starting_BG);
								personalSpace_model_list.add(add_personalSpace_model);
							}
							
							starting_BG.remove(starting_BG.size()-1);
							
						}
						
						
					}
					else
					{
						//Adding speed behavior
						//obstacle_avoidance_BG_list.add(BG);
						////follow_leader_BG_list.add(BG);
						//controlAngleTurn_BG_list.add(BG);
					}
				}
								
				System.out.println("Remove B one by one approach");
				//reset 
				ArrayList<BehaviorGroup> obstacle_avoidance_BG_list = new ArrayList<BehaviorGroup>();
				ArrayList<BehaviorGroup> follow_leader_BG_list = new ArrayList<BehaviorGroup>();
				ArrayList<BehaviorGroup> controlAngleTurn_BG_list = new ArrayList<BehaviorGroup>();
				ArrayList<BehaviorGroup> personalSpace_BG_list = new ArrayList<BehaviorGroup>();
				
				boolean has_obstacle_avoidance_B = false;
				boolean has_follow_leader_B = false;
				boolean has_controlAngleTurn_B = false;
				boolean has_personalSpace_B = false;
				
				//Remove one behavior then test approach
				for (BehaviorGroup BG : original_model.behavior_Group)
				{	
					BehaviorGroup obstacle_avoidance_BG = new BehaviorGroup(BG.extracted_p);
					BehaviorGroup follow_leader_BG = new BehaviorGroup(BG.extracted_p);
					BehaviorGroup controlAngleTurn_BG = new BehaviorGroup(BG.extracted_p);
					BehaviorGroup personalSpace_BG = new BehaviorGroup(BG.extracted_p);
					
					//Each other behavior is removed
					//Speed behavior will be kept
					if (BG.extracted_p != 3.0)
					{
						
						has_obstacle_avoidance_B = false;
						has_follow_leader_B = false;
						has_controlAngleTurn_B = false;
						has_personalSpace_B = false;
						
						for (int i = 0; i < BG.behavior_set.size(); i++)
						{
							//Deep copy the behavior that will be removed
							Behavior removed_behavior = GA_dummy.deepCopyBehavior(BG.behavior_set.get(i));
							
							//Remove one behavior then test approach
							BG.behavior_set.remove(i);
							
							
							//Add one behavior back and test one by one.
							
							//Test the first case
							//Main.runModel_Simulation(original_model.behavior_Group, original_model.behavior_Group,0);
							double obstacleAvoidance_fitnessScore_Average = 0;
							double follow_leader_fitnessScore_Average = 0;
							double exceed_AngleTurn_fitnessScore = 0;
							double personalSpace_fitnessScore = 0;
						
							//Later on can get more overall picture by evaluating modified models several times
							for (int j = 0; j < Main.global_var.simulation_per_generation; j++)
							{
								original_model = setEntityPropertyValue(entity_list, original_model.behavior_Group);
								
								original_model.runSimulation(1, 0);
								
								obstacleAvoidance_fitnessScore_Average += original_model.obstacleAvoidance_fitnessScore ;
								follow_leader_fitnessScore_Average += original_model.follow_leader_fitnessScore;
								exceed_AngleTurn_fitnessScore += original_model.exceed_AngleTurn_fitnessScore;
								personalSpace_fitnessScore += original_model.personalSpace_fitnessScore;
								
								//original_model.goals = Main.setHardcodeGoal();
								//original_model.obstacles = Main.setHardcodeObstacle();
							}	
							
							obstacleAvoidance_fitnessScore_Average = obstacleAvoidance_fitnessScore_Average/Main.global_var.simulation_per_generation;
							follow_leader_fitnessScore_Average = follow_leader_fitnessScore_Average/Main.global_var.simulation_per_generation;;
							exceed_AngleTurn_fitnessScore = exceed_AngleTurn_fitnessScore/Main.global_var.simulation_per_generation;
							personalSpace_fitnessScore = personalSpace_fitnessScore/Main.global_var.simulation_per_generation;
							
							//Find which fitness function is decrease significantly
							//Meaning the removed_behavior is obstacleAvoidance behavior
							if (obstacleAvoidance_fitnessScore_Average <= thredhold)
							{
								obstacle_avoidance_BG.behavior_set.add(removed_behavior);
								has_obstacle_avoidance_B = true;
							}
							
							if (follow_leader_fitnessScore_Average <= thredhold)
							{
								follow_leader_BG.behavior_set.add(removed_behavior);
								has_follow_leader_B = true;
							}
							
							if (exceed_AngleTurn_fitnessScore <= thredhold)
							{
								controlAngleTurn_BG.behavior_set.add(removed_behavior);
								has_controlAngleTurn_B = true;
							}
							
							if (personalSpace_fitnessScore <= thredhold)
							{
								personalSpace_BG.behavior_set.add(removed_behavior);
								has_personalSpace_B = true;
							}
							
							//At the end, add the removed_behavior back to make the model original again
							BG.behavior_set.add(i,removed_behavior);
						}
						
						//At this point, each BG should contain a set of behavior of a specific goal
						if (has_obstacle_avoidance_B == true)
						{
							obstacle_avoidance_BG_list.add(obstacle_avoidance_BG);
						}
						
						if (has_follow_leader_B == true)
						{
							follow_leader_BG_list.add(follow_leader_BG);
						}
						
						if (has_controlAngleTurn_B == true)
						{
							controlAngleTurn_BG_list.add(controlAngleTurn_BG);
							
						}
						
						if (has_personalSpace_B == true)
						{
							personalSpace_BG_list.add(personalSpace_BG);
						}

					}	
					else
					{
						//Adding speed behavior
						obstacle_avoidance_BG_list.add(BG);
						follow_leader_BG_list.add(BG);
						controlAngleTurn_BG_list.add(BG);
						personalSpace_BG_list.add(BG);
					}
				}
				
				//Add to the model list to convert to text file later

				if (obstacle_avoidance_BG_list.size() > 0)
				{
					Model add_obstalce_avoidance_model = setEntityPropertyValue(entity_list, obstacle_avoidance_BG_list);

					obstacle_avoidance_model_list.add(add_obstalce_avoidance_model);

				}

			
			
				if (follow_leader_BG_list.size() > 0)
				{
					
					Model add_follow_leader_model = setEntityPropertyValue(entity_list, follow_leader_BG_list);

					follow_leader_model_list.add(add_follow_leader_model);
				}
				
				
				if (controlAngleTurn_BG_list.size() > 0)
				{

					Model add_controlAngleTurn_model = setEntityPropertyValue(entity_list, controlAngleTurn_BG_list);
			

					controlAngleTurn_model_list.add(add_controlAngleTurn_model);
					
				}
				
				if (personalSpace_BG_list.size() > 0)
				{
					Model add_personalSpace_model = setEntityPropertyValue(entity_list, personalSpace_BG_list);
					
					personalSpace_model_list.add(add_personalSpace_model);
					
				}
			}
		}
		
		
		File folder_name = new File("stage2_models");
		
		folder_name.mkdir();
		
		System.out.println("obstacle_avoidance_model_list size: " + obstacle_avoidance_model_list.size());
		System.out.println("follow_leader_model_list size: " + follow_leader_model_list.size());
		System.out.println("angle_control_model_list size: " + controlAngleTurn_model_list.size());
		System.out.println("personal_space_model_list size: " + personalSpace_model_list.size());
		
		/*
		multipleCandidateModelList obstacle_avoidace_candidate_model = evaluateCandidateModel(obstacle_avoidance_model_list,0);
		System.out.println("Final size of obstacle_avoidance model: " + obstacle_avoidace_candidate_model.steeringModel.size());
		
		for (Model m : obstacle_avoidace_candidate_model.steeringModel)
		{
			Main.printFile(m, 0, "obstacle_avoidance_behavior", folder_name, 0);
		}
		
		System.out.println("Done extract behavior for obstacle_avoidance_behavior");
		
		
		multipleCandidateModelList follow_leader_candidate_model = evaluateCandidateModel(follow_leader_model_list,1);
		System.out.println("Final size of follow leader model: " + follow_leader_candidate_model.steeringModel.size());
		
		
		for (Model m: follow_leader_candidate_model.steeringModel)
		{

			Main.printFile(m, 0, "follow_leader_behavior", folder_name, 0);

		}
	
		System.out.println("Done extract behavior for follow_behavior");
		
		multipleCandidateModelList controlAngleTurn_candidate_model = evaluateCandidateModel(controlAngleTurn_model_list,2);
		System.out.println("Final size of control angle model: " + controlAngleTurn_candidate_model.steeringModel.size());
		
		for (Model m: controlAngleTurn_candidate_model.steeringModel)
		{
			Main.printFile(m, 0, "controlAngleTurn_behavior", folder_name, 0);
		}
		
		System.out.println("Done extract behavior for control Angle Turn behavior");
		*/
		
		multipleCandidateModelList personalSpace_candidate_model = evaluateCandidateModel(personalSpace_model_list,3);
		System.out.println("Final size of personal space model: " + personalSpace_candidate_model.steeringModel.size());
		
		for (Model m: personalSpace_candidate_model.steeringModel)
		{
			Main.printFile(m, 0, "personalSpace_behavior", folder_name, 0);
		}
		
		System.out.println("Done extract behavior for personalSpace behavior");
		
		/*
		for (Model m : obstacle_avoidace_candidate_model.speedModel)
		{
			speed_model_list.add(m);
		}
		
		for (Model m: follow_leader_candidate_model.speedModel)
		{
			speed_model_list.add(m);
		}
		
		for (Model m: controlAngleTurn_candidate_model.speedModel)
		{
			speed_model_list.add(m);
		}
		
		for (Model m: personalSpace_candidate_model.speedModel)
		{
			speed_model_list.add(m);
		}
		
		
		
		ArrayList<Model> speed_model_without_dup = removeDuplication(speed_model_list);
		
		for (Model m: speed_model_without_dup)
		{	
			Main.printFile(m, 0, "speed_behavior", folder_name, 0);		
		}
		
		*/
		
		//MIGHT need to use this later if things does not work out.
		//Speed model can have personal space behavior as well
		//-> Need to check if there are any speed behavior works for personal space.
		//The list below returns 2 lists -> steering B list and speed list.
		//Because speed_model_without_dup contains only speed behavior
		//All speed behaviors that pass the thredhold works for personal space B
		//-> add speed behavior of the list below to personalSpace_cendidate_model
		//multipleCandidateModelList personalSpace_candidate_model_from_speed_model = evaluateCandidateModel(speed_model_without_dup,3);

		
		
		System.out.println();
	}
	
	public ArrayList<Model> removeDuplication(ArrayList<Model> check_model)
	{
		ArrayList<Model> return_model = new ArrayList<Model>();
		
		GeneticAlgorithm dummy_GA = new GeneticAlgorithm();
		
		for (int i = 0; i < check_model.size(); i++)
		{
			if (i == 0)
			{
				return_model.add(check_model.get(i));
			}
			else
			{
				boolean duplication = false;
				
				for (Model m : return_model)
				{
					if (dummy_GA.isModelEqual(check_model.get(i), m) == true)
					{
						duplication = true;
						break;
					}
				}
				
				if (duplication == false)
				{
					return_model.add(check_model.get(i));
				}
			}
		}
		
		return return_model;
	}
	

	public multipleCandidateModelList evaluateCandidateModel(ArrayList<Model> candidate, int test_case) throws InterruptedException
	{
		ArrayList<ArrayList<Entity>> entity_list = Main.createEntityList(1);
		double thredhold = 0.001;

		ArrayList<Model> passed_candidate = new ArrayList<Model>();
		ArrayList<Model> speed_model_list = new ArrayList<Model>();
		
		for (Model m: candidate)
		{			
			
			double obstacleAvoidance_fitnessScore_Average = 0;
			double follow_leader_fitnessScore_Average = 0;
			double exceed_AngleTurn_fitnessScore = 0;
			double personalSpace_fitnessScore = 0;
			
			for (int i = 0; i < Main.global_var.simulation_per_generation; i++)
			{
				m = setEntityPropertyValue(entity_list, m.behavior_Group);
				
				//test obstacle avoidance B
				if (test_case == 0)
				{
					//Re-run the evaluation one more time to make sure the model are classify correctly
					ArrayList<Integer> radius = new ArrayList<Integer>(Arrays.asList(10,20,30));
					
					Random rand = new Random();
					
					ArrayList<Obstacle> obstacle_set = new ArrayList<Obstacle>();
					ArrayList<Entity> obstalce_placement = new ArrayList<Entity>();
					
					for (int j = 0; j < 8; j++)
					{
						Obstacle_circle o = new Obstacle_circle(new Position(0, 0), 15, 2.1);
						
						//position.createRandomPositionInFixZone(new Zone_rectangle(1.0, new Position(0,0),Main.global_var.WorldSize_height,Main.global_var.WorldSize_height), entity);
						o.pos.createRandomPositionInFixZone(new Zone_rectangle(1.0, new Position(0,0),Main.global_var.WorldSize_height,Main.global_var.WorldSize_height), obstalce_placement);
						o.radius = radius.get(rand.nextInt(radius.size()));
						o.speed = 1;
						ArrayList<Integer> angle_change_list = new ArrayList<Integer>(Arrays.asList(30,60,90,120,150,180));
						o.heading = angle_change_list.get(rand.nextInt(angle_change_list.size()));
						
						obstacle_set.add(o);
						obstalce_placement.add(o);
					}
					
					for (Obstacle o : obstacle_set)
					{
						m.obstacles.add(o);
						m.entities.add(o);
					}
					
				}
				else if (test_case == 3)
				{
					//Need to test this with a lot more agents. 20 is not good enough to classify
					for (int k = 0; k < 30; k++) 
					{ 
						 
						Agent single_agent = new Agent(Main.global_var.init_agent, k, m.entities);

						single_agent.addConstraint(Main.constraint_set);

						single_agent.addBehavior(m.behavior_Group);
						
						m.agents.add(single_agent);
						m.entities.add(single_agent); 
						
					}
					
					
					//Remove obstacles since we do not care about them
					m.obstacles.clear();
					m.entities.removeIf(n -> n instanceof Obstacle);
					
				}
				
				
				m.runSimulation(1, 0);
				
				obstacleAvoidance_fitnessScore_Average += m.obstacleAvoidance_fitnessScore ;
				follow_leader_fitnessScore_Average += m.follow_leader_fitnessScore;
				exceed_AngleTurn_fitnessScore += m.exceed_AngleTurn_fitnessScore;
				personalSpace_fitnessScore += m.personalSpace_fitnessScore;
			}
			
			obstacleAvoidance_fitnessScore_Average = obstacleAvoidance_fitnessScore_Average/Main.global_var.simulation_per_generation;
			follow_leader_fitnessScore_Average = follow_leader_fitnessScore_Average/Main.global_var.simulation_per_generation;;
			exceed_AngleTurn_fitnessScore = exceed_AngleTurn_fitnessScore/Main.global_var.simulation_per_generation;
			personalSpace_fitnessScore = personalSpace_fitnessScore/Main.global_var.simulation_per_generation;
			
			boolean pass_threhold = false;
			
			if (test_case == 0)
			{
				if (obstacleAvoidance_fitnessScore_Average >= thredhold)
				{
					pass_threhold = true;
				}
			}
			else if (test_case == 1)
			{
				if (follow_leader_fitnessScore_Average >= thredhold)
				{
					pass_threhold = true;
				}
			}
			else if (test_case == 2)
			{
				
				if (exceed_AngleTurn_fitnessScore >= thredhold)
				{
					
					pass_threhold = true;
				}
			}
			else if (test_case == 3)
			{
				
				
				if (personalSpace_fitnessScore >= thredhold)
				{
					
					pass_threhold = true;
				}
			}
			
			if (pass_threhold == true)
			{	
				
				for (int i = 0; i < m.behavior_Group.size(); i++)
				{
					
					if (m.behavior_Group.get(i).extracted_p == 3.0)
					{
						ArrayList<BehaviorGroup> speed_BG = new ArrayList<BehaviorGroup>();
						speed_BG.add(m.behavior_Group.get(i));
						Model speed_model = new Model(speed_BG);
						speed_model_list.add(speed_model);
						//Remove the speed behavior out of the model
						//Current testing -> keep speed behavior 
						//m.behavior_Group.remove(i);
						
						break;
					}
				}
				
				passed_candidate.add(m);
				
				if (test_case == 2)
				{
					System.out.println("Add angle control B - # Models: " + passed_candidate.size());
				}
				else if (test_case == 3)
				{
					System.out.println("Add personal space B - # Models: " + passed_candidate.size());
				}

			}
			
		}
	
		ArrayList<Model> passed_candidate_no_dup = removeDuplication(passed_candidate);
		
		multipleCandidateModelList return_list = new multipleCandidateModelList(passed_candidate_no_dup,speed_model_list);
		
		return return_list;
	}
	
	
	public Model setEntityPropertyValue (ArrayList<ArrayList<Entity>> entity_list, ArrayList<BehaviorGroup> BG_list)
	{
		ArrayList<Entity> entity_list_temp = new ArrayList<Entity>();
		
		for (Entity e : entity_list.get(0))
		{
			//Agent list need to be deep copy
			if (e instanceof Agent)
			{	
				Agent a = new Agent(((Agent) e).position, ((Agent) e).heading.value, ((Agent) e).speed.value, 1.0);

				a.addBehavior(BG_list);
				
				entity_list_temp.add(a);
			}
			//For now, only agent has behavior
			else
			{
				if (e instanceof Obstacle_circle)
				{
					Obstacle_circle o = new Obstacle_circle((Obstacle_circle) e);
					entity_list_temp.add(o);
				}
				else if (e instanceof Goal)
				{
					if (e instanceof Goal_point)
					{
						Goal_point g = new Goal_point(( Goal_point)e);
						entity_list_temp.add(g);
					}
					else
					{
						entity_list_temp.add(e);
					}
					
				}
				
				
			}
		}
		
		ArrayList<Zone> zone_set = Main.setZone();
		ArrayList<agentGenerator> a_gen_set = Main.setAgentGenerator();
		
		Model return_model = new Model(entity_list_temp, zone_set, a_gen_set, BG_list, BG_list);
					
		
		return return_model;
	}
	
	public void analyzeModel_listTemplate(ArrayList<model_list> model_list_all_generation)
	{
		
	}
	
}

class multipleCandidateModelList
{
	ArrayList<Model> steeringModel = new ArrayList<>();
	ArrayList<Model> speedModel = new ArrayList<>();
	
	public multipleCandidateModelList(ArrayList<Model> steering_m, ArrayList<Model> speed_m)
	{
		//Shadow copy is good enough here
		steeringModel = steering_m;
		speedModel = speed_m;
	}
}

class SortModelTemplatebyName implements Comparator<model_template>
{
	public int compare(model_template a, model_template b) 
	{ 
		int sort_index = 0;
		if (a.model_template.get(sort_index).compareTo(b.model_template.get(sort_index)) < 0)
		{
			return 1;
		}
		else if (a.model_template.get(sort_index).compareTo(b.model_template.get(sort_index)) > 0)
		{
			return -1;
		}
		else
		{
			return 0;
		}
	} 
}
class model_template
{
	public ArrayList<String> model_template = new ArrayList<String>();
	
	public double fitnessScore = 0;
	
	public model_template(ArrayList<String> string_list)
	{
		for (String s : string_list)
		{
			model_template.add(s);
		}
	}
}