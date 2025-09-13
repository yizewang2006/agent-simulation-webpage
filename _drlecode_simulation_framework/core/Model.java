package core;

import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import javax.swing.JFrame;
import javax.swing.JPanel;
import java.awt.geom.Arc2D;

import Action.NeighborReference;
import Action.SelfReference;
import Action.SpaceReference_Expand;
import Action.SpaceReference_Static;
import Activation.Activation;
import Activation_getCheckingValue.NeighborChecking_Value;
import Goal.Goal;
import Goal.Goal_point;
import Goal.Goal_rectangle;
import SpaceHeadingEntity.SpaceHeadingEntity;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.Random;

import Utility.DataStruct_ReserveProperty;
import Utility.GlobalVariable;
import Utility.ReturnSenseObstacle;
import Utility.ReturnVar;
import Utility.myUtility;
import activation_function.Activation_function;
import agents.Agent;
import agents.DataStruct_FOV_Segment;
import agents.FOV_segment;
import agents.FOV_segment_dataStructure;
import agents.Position;
import agents.Property_numeric;
import agents.agentGenerator;
import behavior.Behavior;
import behavior.BehaviorGroup;
import behavior.Constraint;
import entities.Entity;
import filters.Filter;
import filters.Filter_method;
import filters.Filter_ranged;
import fitnessFuntcion.CircleShapeFitnessMetric;
import fitnessFuntcion.SurroundLeaderFitnessMetric;
import fitnessFuntcion.followLeaderFitnessMetric;
import fitnessFuntcion.insideDestinationZone;
import fitnessFuntcion.obstacleAvoidanceFitnessMetric;
import fitnessFuntcion.personalSpaceFitnessMetric;
import fitnessFuntcion.snakeShapeFitnessMetric;
import fitnessFuntcion.speedFitnessMetric;
import fitnessFuntcion.zoneAvoidanceFitnessMetric;
import fitnessFuntcion.zoneDistribution;
import obstacles.Obstacle;
import obstacles.Obstacle_circle;
import obstacles.Obstacle_rectangle;
import zones.Zone;
import zones.Zone_rectangle;
import zones.Zone_triangle;

public class Model 
{
	public String model_name_file;
	
	public double finish_time_test = Main.global_var.duration;
	public double agent_remain_test = 0;
	//Run model
	public ArrayList<Entity> entities = new ArrayList<Entity>();
	public ArrayList<Entity> entities_original = new ArrayList<Entity>();
	
	public ArrayList<Obstacle> obstacles = new ArrayList<Obstacle>();
	public ArrayList<Agent> agents = new ArrayList<Agent>();
	
	public ArrayList<Zone> zones = new ArrayList<Zone>();
	public ArrayList<Goal> goals = new ArrayList<Goal>();
	public ArrayList<agentGenerator> agentGenerator = new ArrayList<agentGenerator>();
	
	public ArrayList<Double> fitness_score_list = new ArrayList<Double>();
	
	public ArrayList<BehaviorGroup> behavior_Group = new ArrayList<BehaviorGroup>();
	public ArrayList<BehaviorGroup> preset_behavior_Group = new ArrayList<BehaviorGroup>();
	
	//This FOV_segment structure only use to draw
	private ArrayList<FOV_segment_dataStructure> FOV_segment_dataStruct_list = new ArrayList<FOV_segment_dataStructure>();
	private ArrayList<DataStruct_ReserveProperty> heading_direction_list_for_special_agent = new ArrayList<DataStruct_ReserveProperty>();
	private ArrayList<SpaceHeadingEntity> heading_static = new ArrayList<SpaceHeadingEntity>();
	public int number_of_agents;

	public int age = 1;
	
	public int ID = 1;
	
	//For keep track purpose only
	public int cross_over_count = 0;
	public int mutation_count = 0;
	
	public ArrayList<Integer> gen_history = new ArrayList<Integer>();
	
	
	public GlobalVariable global_var = new GlobalVariable();
	public myUtility myUtility = new myUtility();
	
	public double sumFitness = 0;
	
	public double fitnessMetric = 0;
	
	public double snakeShape_fitnessScore = 0;
	
	public double obstacleAvoidance_fitnessScore = 0;
	
	public double personalSpace_fitnessScore = 0;
	
	public double speedMetric_fitnessScore = 0;
	
	public double CircleShapeMetric_fitnessScore = 0;
	
	public double zoneAvoicedance_fitnessScore = 0;
	
	public double insideDestinationZone_fitnessScore = 0;
	
	public double collision_fitnessScore = 0;
	
	public boolean finish_insideDestinationZone_fitnessScore = false;
	
	public double finish_time_fitnessScore = Main.global_var.duration;
	
	public double follow_leader_fitnessScore = 0;
	
	public double exceed_AngleTurn_fitnessScore = 0;
	
	public double surround_leader_fitnessScore = 0;
	
	public double turn_Angle_fitnessScore = 0;
	
	public double real_turn_angle = 0;
	
	public int through_put_rate = 0;
	public int current_agent_size = 0;
	
	int x = 0;
	int y = 0;
	
	//0: customize
	//1: check only obstacle avoidance
	//2: check only leader follow
	//3: check only angle turn max
	int test_fitness_score = 0;
	
	//debug propose
	
	public ArrayList<Position> stored_agent_pos_his = new ArrayList<Position>();
	
	public ArrayList<Double> weight_B0 = new ArrayList<Double>();
	public ArrayList<Double> weight_B1 = new ArrayList<Double>();
	public ArrayList<Double> weight_B2 = new ArrayList<Double>();
	
	public ArrayList<WeightInformation> weight_info = new ArrayList<WeightInformation>();
	
	public Model(ArrayList<BehaviorGroup> BG)
	{
		sumFitness = 0;
		fitnessMetric = 0;
		snakeShape_fitnessScore = 0;
		obstacleAvoidance_fitnessScore = 0;
		personalSpace_fitnessScore = 0;
		speedMetric_fitnessScore = 0;
		CircleShapeMetric_fitnessScore = 0;
		insideDestinationZone_fitnessScore = 0;
		collision_fitnessScore = 0;
		finish_insideDestinationZone_fitnessScore = false;
		finish_time_fitnessScore = Main.global_var.duration;
		follow_leader_fitnessScore = 0;
		surround_leader_fitnessScore = 0;
		turn_Angle_fitnessScore = 0;
		exceed_AngleTurn_fitnessScore = 0;
		
		this.finish_time_test = Main.global_var.duration;
		this.agent_remain_test = 0;
		//Adding behaviorGroup here
		for (BehaviorGroup bg : BG)
		{
			behavior_Group.add(bg);
		}
		
		/*
		//Adding behaviorGroup here
		for (BehaviorGroup bg : preset_BG)
		{
			preset_behavior_Group.add(bg);
		}
		*/
		Random rand = new Random();
		
		this.ID = rand.nextInt(100000);
	}
	
	public Model(ArrayList<Entity> entity_add, ArrayList<Zone> zone, ArrayList<agentGenerator> a_gen, ArrayList<BehaviorGroup> BG, ArrayList<BehaviorGroup> preset_BG)
	{
		sumFitness = 0;
		fitnessMetric = 0;
		snakeShape_fitnessScore = 0;
		obstacleAvoidance_fitnessScore = 0;
		personalSpace_fitnessScore = 0;
		speedMetric_fitnessScore = 0;
		CircleShapeMetric_fitnessScore = 0;
		insideDestinationZone_fitnessScore = 0;
		collision_fitnessScore = 0;
		finish_insideDestinationZone_fitnessScore = false;
		finish_time_fitnessScore = Main.global_var.duration;
		surround_leader_fitnessScore = 0;
		turn_Angle_fitnessScore = 0;
		follow_leader_fitnessScore = 0;
		//Construct agent ArrayList
		number_of_agents = global_var.num_of_agents;
		
		for (Entity e: entity_add)
		{
			this.entities.add(e);
			this.entities_original.add(e);
			
			//Agent type
			if(e instanceof Agent)
			{
				agents.add((Agent) e);
				
			}
			//Obstacle type
			else if (e instanceof Obstacle)
			{
				obstacles.add((Obstacle) e);
			}
			//Goal type
			else if (e instanceof Goal)
			{
				goals.add((Goal) e);
			}
		}

		for (Zone z : zone)
		{
			zones.add(z);
		}
		
		for (agentGenerator g: a_gen)
		{
			agentGenerator.add(g);
		}
		
		
		//Adding behaviorGroup here
		for (BehaviorGroup bg : BG)
		{
			behavior_Group.add(bg);
		}
		
		//Adding preset behaviorGroup here
		for (BehaviorGroup bg : preset_BG)
		{
			preset_behavior_Group.add(bg);
		}
		
		Random rand = new Random();
		
		this.ID = rand.nextInt(100000);
		
		gen_history.add(0);
	}
	
	public void resetFitnessScore()
	{
		sumFitness = 0;
		fitnessMetric = 0;
		snakeShape_fitnessScore = 0;
		obstacleAvoidance_fitnessScore = 0;
		personalSpace_fitnessScore = 0;
		speedMetric_fitnessScore = 0;
		CircleShapeMetric_fitnessScore = 0;
		insideDestinationZone_fitnessScore = 0;
		collision_fitnessScore = 0;
		finish_insideDestinationZone_fitnessScore = false;
		finish_time_fitnessScore = Main.global_var.duration;
		turn_Angle_fitnessScore = 0;
		surround_leader_fitnessScore = 0;
		
		//Clear the old set of agent here
		if (Main.global_var.search_Model == false)
		{
			agents.clear();
			entities.removeIf(n -> (n instanceof Agent));
		}
		
		
	}
	
	//Will process decision making of each agent at each time steps
	public void runSimulation(int gen_th, int test_case) throws InterruptedException
	{		
		DrawWorld sim = null;
		test_fitness_score = test_case;
		
		if (Main.global_var.simulation_Draw == true)
		{
			JFrame frame = new JFrame();
			sim = new DrawWorld();
			frame.add(sim);
			frame.setSize(global_var.WorldSize_width, global_var.WorldSize_height+30);
			frame.setVisible(true);
			frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
			
		}
		
		//reset metric value
		//i is time steps
		//Finish time should be check one time only
		boolean check_finish_time = false;
		int[] num_overlap = {0,0,0,0,0};
		int count_num_of_duration_cannot_generate_agent = 0;
		
		durationloop:
		for(int i = 0; i < global_var.duration; i++)
		{
			
			//Need to generate agent here
			//System.out.println(i);
			
			/*
			if (agents.size() < global_var.num_of_agents)
			{
				for (agentGenerator a_gen : agentGenerator)
				{
					if (i % a_gen.rate == 0)
					{
						a_gen.randomYPosition();
						Agent agent = new Agent(a_gen.position, a_gen.starting_heading, a_gen.starting_speed, a_gen.staring_type);
						agent.addBehavior(behavior_Group);
						entities.add(agent);
						agents.add(agent);
					}
				}
			}
			*/
			
			//Create a set of agents here
			//With rate and duration
			
			//
			int rate = Main.global_var.generator_rate;
			int density = Main.global_var.generator_density;
						
			if (Main.global_var.init_agent == "random")
			{
				
				if (i % 150 == 0 )
				{
					Agent single_agent = new Agent(global_var.init_agent, 0, entities);
					
					single_agent.addBehavior(behavior_Group);
					
					single_agent.addConstraint(Main.constraint_set);
					
					//entities.add(single_agent); 
					
					//agents.add(single_agent);
				}
				
				if (agents.size() < global_var.num_of_agents)
				{
					if ( i < Main.global_var.generator_duration)
					{
						if (i % rate == 0)
						{
							if (count_num_of_duration_cannot_generate_agent > 0)
							{
								count_num_of_duration_cannot_generate_agent--;
							}
							
							for (int j = 0; j < density; j++)
							{
								//System.out.print(j + " ");
								Agent single_agent = new Agent(global_var.init_agent, j, entities);

								//If agent get trapped, quit right away.
								if (single_agent.position.x == 0 && single_agent.position.y == 0)
								{
									num_overlap[j]++;
								}
								else
								{
									//Reduce the counting
									if (num_overlap[j] > 0)
									{
										num_overlap[j]--;
									}
									
									
									single_agent.addBehavior(behavior_Group);
									
									single_agent.addConstraint(Main.constraint_set);
									
									//entities.add(single_agent); 
									
									//agents.add(single_agent);
								}
								
								
							}
							
							for (int num : num_overlap)
							{
								//System.out.println(num);
								
								if (num == 7)
								{
									//System.out.println("Cannot place anymore agent");
									
									this.finish_time_test = Main.global_var.duration;
									
									this.finish_time_fitnessScore = 0.000000001;
									
									this.collision_fitnessScore = 0.000000001;
									
									this.insideDestinationZone_fitnessScore = 0.000000001;
									
									//System.out.println("Inside" + insideDestinationZone_fitnessScore);
								
									this.fitnessMetric = (insideDestinationZone_fitnessScore * collision_fitnessScore * finish_time_fitnessScore);
									
									break durationloop;
								}
							}
						}
					}
					
				}
				else
				{
					if ( i < Main.global_var.generator_duration)
					{
						if (i % rate == 0)
						{
							count_num_of_duration_cannot_generate_agent++;
						}
						
						if (count_num_of_duration_cannot_generate_agent > 20)
						{
							//System.out.println("Cannot generate anymore agent");
							
							this.finish_time_test = Main.global_var.duration;
							
							this.finish_time_fitnessScore = 0.000000001;
							
							this.collision_fitnessScore = 0.000000001;
							
							this.insideDestinationZone_fitnessScore = 0.000000001;
							
							//System.out.println("Inside" + insideDestinationZone_fitnessScore);
						
							this.fitnessMetric = (insideDestinationZone_fitnessScore * collision_fitnessScore * finish_time_fitnessScore);
							
							break durationloop;
						}
					}
					
					
				}
				
				
			}
			
			/*
			if (agents.size() == global_var.num_of_agents)
			{
				for (agentGenerator a_gen : agentGenerator)
				{
					//a_gen.rate = 500;
				}
			}
			*/
			
			/*
			if (i >= 150 && i <= 400)
			{
				int count = 0;
				for (Agent a : agents)
				{
					if (a.speed.value == 0)
					{
						count++;
					}
				}
				
				if (count >= 40)
				{
					this.finish_time_test = Main.global_var.duration;
					
					this.finish_time_fitnessScore = 0.000000001;
					
					this.collision_fitnessScore = 0.000000001;
					
					this.insideDestinationZone_fitnessScore = 0.000000001;
					
					//System.out.println("Inside" + insideDestinationZone_fitnessScore);
				
					this.fitnessMetric = (insideDestinationZone_fitnessScore * collision_fitnessScore * finish_time_fitnessScore);
					
					break durationloop;
				}
			}
			*/
			
			//System.out.println ("# agents after before"  + agents.size());
			if (Main.global_var.print_info_debug == true)
			{
				//System.out.println (i);
			}
			
			/*
			//Shuffle agent list so that there is no priority between agents.
			if (Main.global_var.random_no_seed == true)
			{
				Collections.shuffle(agents);
			}
			*/
			

			//j is index of each agent
			for(int j = 0; j < agents.size(); j++)
			{
				

				//Reset the sensing
				for (Entity e: entities)
				{
					e.sense = false;
					e.warp = false;
				}
				
				if (Main.global_var.init_agent.equals("hardcode"))
				{
					if (j != 0)
					{
						//break;
					}
				}
				
				
				
				ArrayList<ArrayList<Entity>> observed_entities = new ArrayList<ArrayList<Entity>>();
				
				ArrayList<Entity> neighbor_entities = new ArrayList<Entity>();
				ArrayList<Entity> entities_360FOV = new ArrayList<Entity>();
				
				//To store neighbor_entities in each FOV_zone
				//ArrayList<ArrayList<Entity>> FOV_zone_neighbor_entities =  new ArrayList<ArrayList<Entity>>();
				
				double activate = 0;
				//Check activation first
				//Action is executed only when activation passed	
								
				Agent target_agent = agents.get(j);
				
				/*
				if (j == Main.global_var.specialAgent)
				{
					System.out.println();
				
				}
				*/
				
				//Get entity within FOV
				//FOV_zone_neighbor_entities = target_agent.fov.getEntityWithinEachFOVSegment(entities, target_agent, i);
				
				observed_entities = target_agent.fov.getEntityWithinFOV(entities, target_agent, i);
				
				neighbor_entities = observed_entities.get(0);
				entities_360FOV = observed_entities.get(1);
				
				//Adding global entity 
				//For now, only goal is global entity
				//-> Hard code
				//Only door is global 
				//The spatial zone is not
				for (Goal g : goals)
				{					
					neighbor_entities.add(g);
				}
				
				
				ReturnVar return_var = new ReturnVar();
				ReturnVar return_var_for_null_activation_only = new ReturnVar();
				
				//Find the index of the property if there is one
				int index_p_set = 0;
				double extract_p = 0;
				
				/*
				if (j == Main.global_var.specialAgent)
				{
					System.out.println();
				}
				*/
				
				//Process each behavior group
				for(int k = 0; k < target_agent.behavior_Group.size(); k++)
				{
					//Get the extract property of the behavior group
					extract_p = target_agent.behavior_Group.get(k).extracted_p;
					
					for( int l = 0; l < target_agent.property_set.size(); l++)
					{
						if (extract_p == target_agent.property_set.get(l).property_ID)
						{
							index_p_set = l;
							break;
						}
					}
					
					//For each behavior in each behavior Group
					for(int l = 0; l < target_agent.behavior_Group.get(k).behavior_set.size(); l++)
					{
						Behavior current_behavior = target_agent.behavior_Group.get(k).behavior_set.get(l);
						
						//Activation is always true
						if(current_behavior.activation.option == 0)
						{
							current_behavior.weight = current_behavior.activation.activation_function.weight;
						}
						//Activation base on self condition
						else if (current_behavior.activation.option == 1)
						{
							current_behavior.weight = current_behavior.activation.return_weight_SelfCheck(target_agent);
						}
						//Activation base on neighbor condition
						else if (current_behavior.activation.option == 2)
						{
							current_behavior.weight = current_behavior.activation.return_weight_NeighborCheck(target_agent, neighbor_entities, i);
						}
						//Activation base on space condition
						else if (current_behavior.activation.option == 3)
						{
							current_behavior.weight = current_behavior.activation.return_weight_SpaceCheck(target_agent, neighbor_entities, obstacles, goals, i);

						}
						
					
						Random rand;
						
						rand = new Random();  
						
						/*
						if (Main.global_var.random_no_seed == true)
						{
							rand = new Random();  
						}
						else
						{
							rand = new Random(Main.global_var.random_seed);  
						}
						*/
						
						double reference_value = 0;
						
						
						//Action part gets self reference
						if (current_behavior.action instanceof SelfReference)
						{
							SelfReference self_r_action = (SelfReference) current_behavior.action;
							reference_value = self_r_action.getReferenceValue(target_agent);
							
						}
						//Action part gets neighbor reference
						else if (current_behavior.action instanceof NeighborReference)
						{
							NeighborReference neighbor_r_action = (NeighborReference) current_behavior.action;

							reference_value = neighbor_r_action.getReferenceValue(target_agent, neighbor_entities);
								
							//Meaning that target agent cannot get any reference value from neighbor
							if (Double.isNaN(reference_value) == true)
							{
								
								//Agent then should get the property_p value from self.
								if(extract_p == 1 || extract_p == 2 || extract_p == 2.1)
								{
									reference_value = target_agent.heading.value;
									
									reference_value += current_behavior.action.offset;
									
									if (reference_value < 0)
									{
										reference_value = 360 + reference_value;
									}
									else if (reference_value > 360)
									{
										reference_value = reference_value - 360;
									}

								}
								//SPEED
								else if (extract_p == 3)
								{
									reference_value = target_agent.speed.value;
									
									reference_value += current_behavior.action.offset;;
								}
								//TYPE
								else if (extract_p == 4)
								{
									//FOR now, we do not care
									//TYPE is private property
								}
								//ZONE
								else if (extract_p == 5)
								{
									//FOR now, we do not care
									//ZONE is private property
								}
								//UNRESERVED PROPERTY
								else 
								{
								}
								
							}
						}
						//Action parts get space reference
						else if (current_behavior.action instanceof SpaceReference_Expand)
						{
							ArrayList<Entity> neighbor_for_space = new ArrayList<>();
							
							for (Entity e : neighbor_entities)
							{
								neighbor_for_space.add(e);
							}
							
							//Reset the sensing
							for (Entity e: entities)
							{
								e.sense = false;
							}
							
							SpaceReference_Expand space_r_action = (SpaceReference_Expand) current_behavior.action;
							//SpaceReference_Static space_r_action = (SpaceReference_Static) current_behavior.action;
							reference_value = space_r_action.getReferenceValue(neighbor_entities, obstacles, goals, target_agent, true);
								
							reference_value += current_behavior.action.offset;
							
							//Only get detail of a FOV_segment structure of special agent
							if (j == Main.global_var.specialAgent)
							{
								if (Main.global_var.fov_Draw == true)
								{
									FOV_segment_dataStruct_list = new ArrayList<FOV_segment_dataStructure>();
									
									//FOV_segment_dataStruct_list = target_agent.fov.getEntityWithAdaptiveFOV(neighbor_entities, obstacles, target_agent, 0);
									
									FOV_segment_dataStruct_list = space_r_action.getProcessFOV_segment(neighbor_entities, obstacles, goals, target_agent);
									
									if (FOV_segment_dataStruct_list.get(0).FOV_segment_list.size() == 0)
									{
										//System.out.println();
									}
								}
							}
						}

						else if (current_behavior.action instanceof SpaceReference_Static)
						{
							ArrayList<Entity> neighbor_for_space = new ArrayList<>();
							
							for (Entity e : neighbor_entities)
							{
								neighbor_for_space.add(e);
							}
							
							//Reset the sensing
							for (Entity e: entities)
							{
								e.sense = false;
							}
							
							//SpaceReference_Expand space_r_action = (SpaceReference_Expand) current_behavior.action;
							SpaceReference_Static space_r_action = (SpaceReference_Static) current_behavior.action;
							reference_value = space_r_action.getReferenceValue(neighbor_entities, obstacles, goals, target_agent, true);
							
							if (reference_value < 0)
							{
								reference_value = -reference_value;
								
							}
							
							reference_value += current_behavior.action.offset;
							
							//Only get detail of a FOV_segment structure of special agent
							if (j == Main.global_var.specialAgent)
							{
								if (Main.global_var.fov_Draw == true)
								{
									heading_static = new ArrayList<SpaceHeadingEntity>();
									
									int space_between_each_option = 10;
									

									//heading_static.add(new SpaceHeadingEntity(a,0,0,Main.global_var.fov_distance,Main.global_var.fov_distance,Main.global_var.fov_distance,Main.global_var.fov_distance,Main.global_var.fov_distance));

									heading_static = space_r_action.generateHeadingOptionProperty(neighbor_entities, obstacles, target_agent);
									
								}
							}
						}
						//Angle behavior
						if(extract_p == 1 || extract_p == 2.0 || extract_p == 2.1)
						{
							if (Double.isNaN(reference_value) == true)
							{
								return_var_for_null_activation_only.setHeadingReference(target_agent.heading, reference_value, current_behavior.weight, target_agent.constraint_set);
							}
							else
							{
								return_var.setHeadingReference(target_agent.heading, reference_value, current_behavior.weight, target_agent.constraint_set);
							}
							
						}
						//Speed behavior
						else if(extract_p == 3)
						{
							if (Double.isNaN(reference_value) == true)
							{
								return_var_for_null_activation_only.setNumericReference(target_agent.speed, reference_value,current_behavior.weight, target_agent.constraint_set);
							}
							else
							{
								return_var.setNumericReference(target_agent.speed, reference_value,current_behavior.weight, target_agent.constraint_set);
							}
							
						}
						else if(extract_p == 4)
						{
							//Do not care for now
						}
						else if(extract_p == 5)
						{
							//Do not care for now
						}
						//Access to unreserved property
						else
						{

						}
						
						
					}
				}

				double next_heading = 0;
				double next_speed = 0;
				//This value is used for an unreserved property
				double next_value = 0;
				boolean in_entrance = false;
				
				/*
				 Hard code slow down behavior when compare your distance to goal
				 to your nearest neighbor's 
				 * */
				/*
				if (!(target_agent.getCurrentZone((Goal_rectangle) goals.get(1)) != 0))
				{
					Activation activation = new Activation();

					//Filter the nearest agent
					ArrayList<Filter> filter_chain = new ArrayList<Filter>();
					filter_chain.add(new Filter_ranged(1,0,30));
					//filter_chain.add(new Filter_ranged(2.1,-80,80));
					filter_chain.add(new Filter_ranged(4,new ArrayList<Double>(Arrays.asList(1.0))));
					filter_chain.add(new Filter_method(1,1));
					
					Behavior b = new Behavior(activation, filter_chain, 0);
					ArrayList<ArrayList<Entity>> temp_1 = new ArrayList<ArrayList<Entity>>();

					temp_1 = target_agent.fov.getEntityWithinFOV(entities, target_agent, i);
					ArrayList<Entity> neighbor_e_a1 = temp_1.get(0);
					ArrayList<Entity> return_e_a1 = b.getFilteredAgents(b.filter_chain, target_agent, neighbor_e_a1, i);
					
					if (return_e_a1.size() > 0)
					{
						Agent nearest_neighbor = (Agent) return_e_a1.get(0);
						
						if (target_agent.distance_to_goal.value > nearest_neighbor.distance_to_goal.value)
						{
							//return_var.setNumericReference(target_agent.speed, -0.5 , 100, target_agent.constraint_set);
						}
					}
				}
				*/
				//There will be always a moving toward to goal behavior
				//At least for now
				
				/*
				if (target_agent.getCurrentZone((Goal_rectangle) goals.get(1)) != 0)
				{
					ArrayList<Entity> select_goal_entity = new ArrayList<Entity>();

					select_goal_entity.add(goals.get(0));

					double reference_value = getReferenceValue(1, target_agent, select_goal_entity);

					reference_value += 0;

					return_var.setHeadingReference(target_agent.heading, reference_value,100, target_agent.constraint_set);
					
					in_entrance = true;
					
					//Speed is maintain as max
					//return_var.setNumericReference(target_agent.speed, 2,5, target_agent.constraint_set);
				}
				else
				{
					ArrayList<Entity> select_goal_entity = new ArrayList<Entity>();

					select_goal_entity.add(goals.get(1));

					double reference_value = getReferenceValue(1, target_agent, select_goal_entity);

					reference_value += 0;

					return_var.setHeadingReference(target_agent.heading, reference_value, 1, target_agent.constraint_set);
					
				}
				*/
				

				if (Main.global_var.print_info_debug == true)
				{
					for (DataStruct_ReserveProperty data : return_var.heading_direction)
					{
						System.out.println("Value: " + data.value + "  Weight: " + data.weight);
					}
				}
				
				
				
				//Adding speed behavior here
				
				/*
				//Set a small behavior to check if nothing in front of an agent, then it can move forward
				activation = new Activation();
				
				filter_chain = new ArrayList<Filter>();
				filter_chain.add(new Filter_ranged(1,0,12));
				filter_chain.add(new Filter_ranged(2.1,-90,90));
				
				b = new Behavior(activation, filter_chain, 0);
				neighbor_e_a1 = target_agent.fov.getEntityWithinFOV(entities, target_agent, i);
				return_e_a1 = b.getFilteredAgents(b.filter_chain, target_agent, neighbor_e_a1, i);
				
				//No agent near by
				//Speed up when no entity in front
				if (return_e_a1.size() == 0)
				{
					double reference_value = target_agent.speed.value + 0.5;
					
					return_var.setNumericReference(target_agent.speed, reference_value, 1 , target_agent.constraint_set);
				}
				//There are entity nearby
				//Slow down when near an entity
				else
				{
					double reference_value = target_agent.speed.value - 1;
					
					return_var.setNumericReference(target_agent.speed, reference_value, 1 , target_agent.constraint_set);
				}
				*/
								
				//ACT STEP
				if(return_var.heading_direction.size() > 0)
				{
					next_heading = getNextAverage_Heading_withWeight(target_agent, return_var);
					
					
					//Only get detail of a FOV_segment structure of special agent
					if (j == Main.global_var.specialAgent)
					{
						if (Main.global_var.fov_Draw == true)
						{
							heading_direction_list_for_special_agent = new ArrayList<DataStruct_ReserveProperty>();
							
							for (DataStruct_ReserveProperty h : return_var.heading_direction)
							{
								heading_direction_list_for_special_agent.add(h);
							}
							
							//Adding the overall heading as last element.
							DataStruct_ReserveProperty overall_heading = new DataStruct_ReserveProperty(next_heading, 1);
							heading_direction_list_for_special_agent.add( overall_heading);
						}
					}
					
					
				}
				//This is where there is no reference value has return for all behavior
				//Only then the behavior of reference_value = NaN is used.
				else
				{
					if (return_var_for_null_activation_only.heading_direction.size() > 0)
					{
						next_heading = getNextAverage_Heading_withWeight(target_agent, return_var_for_null_activation_only);
					}
					else
					{
						next_heading = target_agent.heading.value;
					}
					
				}

				if (return_var.speed.size() > 0)
				{
					
					next_speed = getNextAverage_numericValue_withWeight(target_agent, return_var);
				}
				else
				{
					if (return_var_for_null_activation_only.speed.size() > 0)
					{
						next_speed = getNextAverage_numericValue_withWeight(target_agent, return_var_for_null_activation_only);
					}
					else
					{
						next_speed = target_agent.speed.value;
						
						//next_speed = target_agent.speed.value + 2;
						
						Property_numeric s = (Property_numeric) target_agent.speed;
						
						if (next_speed >= s.upperRange)
						{
							next_speed = s.upperRange;
						}
					}
					
				}
				
				if(return_var.property_set.size() > 0)
				{
					for (int n = 0; n < return_var.property_set.size(); n++)
					{
						//Find the match property ID between target agent and return_var ID
						if ( target_agent.property_set.get(index_p_set).property_ID == return_var.property_set.get(n).property_ID )
						{
							ArrayList<Double> weight_set = return_var.property_set.get(n).weight_set;
							
							double sum_weight = 0;
							
							for (Double w : weight_set )
							{
								sum_weight += w;
							}
							
							ArrayList<Double> value_set = return_var.property_set.get(n).value_set;

							for (int a = 0; a < value_set.size(); a++)
							{
								next_value += value_set.get(a)*(weight_set.get(a)/sum_weight);
							}

							break;
						}
					}
				}
				else
				{	
					//Only get next value if there is at least one user defined property 
					if (target_agent.property_set.size() > 0)
					{
						next_value = target_agent.property_set.get(index_p_set).value;
					}
					
				}
				
				//next value (next_heading, next_speed) of properties need to be checked for constraint here			
 				for (Constraint c: target_agent.constraint_set)
 				{
 					if(c.property_ID == 1)
 					{
 						
 					}
 					//Angle property
 					else if (c.property_ID == 1 || c.property_ID == 2.0 || c.property_ID == 2.2)
 					{
 						next_heading = getMaxAngleTurn_new(target_agent, (int) target_agent.heading.value, (int) next_heading, c.max_increase);
 						
 						if (next_heading > 360)
 						{
 							next_heading = next_heading - 360;
 						}
 						
 					}
 					//Speed
 					else if (c.property_ID == 3)
 					{
 						next_speed = getMaxSpeedChange(target_agent.speed.value, next_speed, c);
 					}
 					//Type
 					else if (c.property_ID == 4)
 					{
 						
 					}
 					//User defined property
 					else
 					{
 						
 					}
 						
 				}
 				
 				Random rand = new Random();
 				
 				//Adding randomness here
 				ArrayList<Integer> random_value = new ArrayList<Integer>(Arrays.asList(-10,-8,-6,-4,-2,0,2,4,6,8,10));
 				
 				if (in_entrance == false)
 				{
 					//next_heading = next_heading + random_value.get(rand.nextInt(random_value.size()));
 				}
 					
 				
				target_agent.position_next = target_agent.position_next.setNextPositionFromAngleAndSpeed(target_agent.position, (int)next_heading, next_speed);
				target_agent.distance_to_goal.value_next = target_agent.position_next.getDistanceBetween2Position(target_agent.position_next, new Position(150,136));
				
				//Agent must stay inside world bound
				if (global_var.worldWarp == false)
				{
					if (target_agent.position_next.x < 0)
					{
						target_agent.position_next.x = 0;
					}
					if (target_agent.position_next.x > global_var.WorldSize_width)
					{
						target_agent.position_next.x = global_var.WorldSize_width;
					}
					
					if (target_agent.position_next.y < 0)
					{
						target_agent.position_next.y = 0;
					}
					if (target_agent.position_next.y > global_var.WorldSize_height)
					{
						target_agent.position_next.y = global_var.WorldSize_height;
					}
					
					
				}
				
 				Position temp = new Position(target_agent.position_next.x, target_agent.position_next.y);


 				target_agent.heading.value_next = (int)next_heading;
 				
 				if (Main.global_var.print_info_debug == true)
 				{
 					System.out.println("Final heading value: " + target_agent.heading.value_next);
 				}
 				
 				
 				
				target_agent.speed.value_next = next_speed;
				
				if (target_agent.property_set.size() > 0)
				{
					target_agent.property_set.get(index_p_set).value = next_value;
				}
				
				if (global_var.search_Model == false)
				{
					
					target_agent.heading_history.add((int)next_heading);
					target_agent.pos_history.add(temp);
					//target_agent.type_history.add(target_agent.type);
					/*
					if(target_agent.equals(agents.get(global_var.specialAgent)))
					{
						target_agent.aiming_history.add(temp);
					}
					*/
				}
				
			}
			
			if (Main.global_var.search_Model == false)
			{
				//Processed weight information here
				
				double sum_w0 = 0;
				double sum_w1 = 0;
				double sum_w2 = 0;
				
				for (double d: weight_B0)
				{
					sum_w0 += d;
				}
				
				for (double d: weight_B1)
				{
					sum_w1 += d;
				}
				
				for (double d: weight_B2)
				{
					sum_w2 += d;
				}
				
				
				
				double total_sum = sum_w0 + sum_w1 + sum_w2;
				
				WeightInformation temp = new WeightInformation (sum_w0/total_sum, sum_w1/total_sum, sum_w2/total_sum, agents.size());
				
				weight_info.add(temp);
				
				//System.out.println("w0: " + temp.weight_B0  + "w1: " + temp.weight_B1 + "w2: " + temp.weight_B2 + "a_remain: " + temp.agent_remain);
				
				String result = String.format("w0: %.2f w1: %.2f w2: %.2f a_r: %d", temp.weight_B0 , temp.weight_B1 , temp.weight_B2 , temp.agent_remain);
				
				//System.out.println(i + "-" + result);
				
				weight_B0.clear();
				weight_B1.clear();
				weight_B2.clear();
			}
			
			
			
			
			//If agent cannot pass the activation, simply staystil
			/*
				else
				{
					target_agent.pos_history.add(target_agent.position);
					target_agent.heading_history.add(target_agent.heading);
				}
			 */
			
			//Fitness function that does not need burn out time.
			
			//For lane formation, SNAKE SHAPE fitness will need to be measure at the beginning.
			
			//snakeShapeFitnessMetric snakeShapeFitnessMetric = new snakeShapeFitnessMetric(entities);
			//snakeShape_fitnessScore += snakeShapeFitnessMetric.fitnessScore(i);
			//System.out.println("Snake: " + snakeShape_fitnessScore);
			
			//PERSONAL SPACE
			//forming shape behavior.
			
			personalSpaceFitnessMetric personalSpaceFitnessMetric = new personalSpaceFitnessMetric(agents, goals);
			personalSpace_fitnessScore += personalSpaceFitnessMetric.fitnessScore(i);
			
			//System.out.println("personal Space fitness functionL: " + personalSpaceFitnessMetric.fitnessScore(i));
			//OBSTACLE AVOIDANCE
			obstacleAvoidanceFitnessMetric obstacleAvoidanceFitnessMetric = new obstacleAvoidanceFitnessMetric(agents, obstacles);
			obstacleAvoidance_fitnessScore += obstacleAvoidanceFitnessMetric.fitnessScore(i);
			//System.out.println("Obstacle avoidance fitness function: " + obstacleAvoidanceFitnessMetric.fitnessScore(i));

			
			//zoneDistribution zoneDistributionMetric = new zoneDistribution(agents, zones);
			//zoneDistribution_fitnessScore += zoneDistributionMetric.fitnessScore(i);
			//System.out.println("Zone distribution fitness function: " + zoneDistributionMetric.fitnessScore(i));
			
			//Spped metric
			//speedFitnessMetric speedFitnessMetric = new speedFitnessMetric(agents);
			//speedMetric_fitnessScore += speedFitnessMetric.fitnessScore(i);
			
			//When all agents are removed

			if (agents.size() <= 1 && check_finish_time == false)
			{

				finish_time_fitnessScore = i;

				
				check_finish_time = true;

				finish_insideDestinationZone_fitnessScore = true;
				
				this.finish_time_test = i;
				
				System.out.println("Finish time: " + finish_time_fitnessScore );
			}
			//Compare the result to see when the insideDestinationZone is fulfill
			
			if (zones.size() == 0)
			{
				//System.out.println("zone is empty");
			}
			
			//Ignore the first 1/3 duration when calculating fitness function
			if (i >= global_var.burn_in_step)
			{
				//CircleShapeFitnessMetric circleShapeMetric = new CircleShapeFitnessMetric(agents, 25, 200);
				//CircleShapeMetric_fitnessScore += circleShapeMetric.fitnessScore(i);
				
				//SNAKE SHAPE
				//snakeShapeFitnessMetric snakeShapeFitnessMetric = new snakeShapeFitnessMetric(entities);
				//snakeShape_fitnessScore += snakeShapeFitnessMetric.fitnessScore(i);
				
				followLeaderFitnessMetric followLeaderFitnessMetric = new followLeaderFitnessMetric(agents, goals);
				follow_leader_fitnessScore+= followLeaderFitnessMetric.fitnessScore(i);
				
				
				//SurroundLeaderFitnessMetric surroundLeaderFitnessMetric = new SurroundLeaderFitnessMetric(agents, goals, 15, 90);
				//surround_leader_fitnessScore += surroundLeaderFitnessMetric.fitnessScore(i);
				
				//When simulation reach the last iteration, calculate Fitness metric
				if (i == global_var.duration - 1)
				{	
					
					//Customize
					if (test_fitness_score == 0)
					{
						//System.out.println("number of escaped agents:" + through_put_rate);
						double temp = 0;
						snakeShape_fitnessScore = 1;
						//snakeShape_fitnessScore = snakeShape_fitnessScore/(global_var.duration);
						//snakeShape_fitnessScore = normalize_score(snakeShape_fitnessScore,500,0);
						//System.out.println("Snake metric:" + snakeShape_fitnessScore);
						
						CircleShapeMetric_fitnessScore = 1;
						CircleShapeMetric_fitnessScore = CircleShapeMetric_fitnessScore/(global_var.duration - global_var.burn_in_step);
						CircleShapeMetric_fitnessScore = normalize_score(CircleShapeMetric_fitnessScore,10,0);
						//System.out.println("Circle metric:" + CircleShapeMetric_fitnessScore);
						
						//personalSpace_fitnessScore = 1;		
						personalSpace_fitnessScore = personalSpace_fitnessScore/(global_var.duration);		
						personalSpace_fitnessScore = normalize_score(personalSpace_fitnessScore,5,0);
						//System.out.println(personalSpace_fitnessScore);

						
						obstacleAvoidance_fitnessScore = 1;	
			
						//obstacleAvoidance_fitnessScore = obstacleAvoidance_fitnessScore/(global_var.duration);
						//System.out.println("obstacleAvoidance_fitnessScore: " + obstacleAvoidance_fitnessScore );
						//obstacleAvoidance_fitnessScore = normalize_score(obstacleAvoidance_fitnessScore,5,0);
						 			
						collision_fitnessScore = 1;
						//temp = collision_fitnessScore;
						//collision_fitnessScore = collision_fitnessScore/global_var.duration;
						//System.out.println("Colision finish score: " + collision_fitnessScore);
						//collision_fitnessScore = normalize_score(collision_fitnessScore,10,0);
						
						
						speedMetric_fitnessScore = 1;
						
						int count_agent_speed = 0;
						
						for (Agent a: agents)
						{
							if(a.speed.value == 0)
							{
								count_agent_speed ++;
							}
						}
						
						//speedMetric_fitnessScore = count_agent_speed;
						
						//speedMetric_fitnessScore = speedMetric_fitnessScore/(global_var.duration);
						//speedMetric_fitnessScore = normalize_score(speedMetric_fitnessScore,20,0);
						//System.out.println("Speed fitness: " + speedMetric_fitnessScore);
						
						//Inside a fix zone fitness score
						//Only check the score at the end.
						//insideDestinationZone_fitnessScore = 1;
						//insideDestinationZone_fitnessScore = insideDestinationZone_fitnessScore/(global_var.duration/2);
						//This is a special case when higher is better
						//Optimize score is 288
						
						
						//Evaluate time of the last agent is removed from space
						//The smaller time, the better
						finish_time_fitnessScore = 1;
		
						//finish_time_fitnessScore = normalize_score(finish_time_fitnessScore,Main.global_var.duration,300);
						//System.out.println("Finish time score: " + finish_time_fitnessScore);
						
						//+1 is for the very first timestep
						//int eval = (Main.global_var.generator_duration / Main.global_var.generator_rate + 1) * Main.global_var.generator_density * 2;
					
						
						int eval = Main.global_var.num_of_agents;
						//int eval = 120;
						
						/*
						if (j1 == 2 || j1 == 3)
						{
							eval = Main.global_var.num_of_agents/2;
						}
						*/
						
					
						insideDestinationZone_fitnessScore = 1;

						//System.out.println(insideDestinationZone_fitnessScore);
						
						/*
						insideDestinationZone_fitnessScore =  eval - insideDestinationZone_fitnessScore;
						
						this.agent_remain_test = insideDestinationZone_fitnessScore;
						
						
						if (insideDestinationZone_fitnessScore > eval)
						{
							insideDestinationZone_fitnessScore = eval;
						}
						else if (insideDestinationZone_fitnessScore < 0)
						{
							insideDestinationZone_fitnessScore = 0;
						}
						
						insideDestinationZone_fitnessScore = normalize_score(insideDestinationZone_fitnessScore,eval,1);
						*/
						
						//System.out.println("Inside" + insideDestinationZone_fitnessScore);
					
						//follow_leader_fitnessScore = 1;
						follow_leader_fitnessScore = follow_leader_fitnessScore/(global_var.duration-global_var.burn_in_step);
						//System.out.println("Follow leader fitness: " + follow_leader_fitnessScore);
						follow_leader_fitnessScore = normalize_score(follow_leader_fitnessScore,120,0);
						//System.out.println("Follow leader fitness: " + follow_leader_fitnessScore);
						
						
						surround_leader_fitnessScore = 1;
						//surround_leader_fitnessScore = surround_leader_fitnessScore/(global_var.duration-global_var.burn_in_step);
						//System.out.println("Surround leader fitness: " + surround_leader_fitnessScore);
						
						if (surround_leader_fitnessScore <= 0.5)
						{
							surround_leader_fitnessScore = 0.000000001;
						}
						
						
						//exceed_AngleTurn_fitnessScore = 1;
						exceed_AngleTurn_fitnessScore = exceed_AngleTurn_fitnessScore/Main.global_var.duration;
						exceed_AngleTurn_fitnessScore = normalize_score(exceed_AngleTurn_fitnessScore,80,15);
						
						//System.out.println("Exceed angle turn: " + exceed_AngleTurn_fitnessScore);
						fitnessMetric = (snakeShape_fitnessScore * CircleShapeMetric_fitnessScore * obstacleAvoidance_fitnessScore 
								* speedMetric_fitnessScore * personalSpace_fitnessScore * insideDestinationZone_fitnessScore 
								* collision_fitnessScore * finish_time_fitnessScore * follow_leader_fitnessScore 
								* exceed_AngleTurn_fitnessScore * surround_leader_fitnessScore);
						//System.out.println("Overall fitness: " + fitnessMetric);
						
					}

					//System.out.println("Follow leader fitness s: " + follow_leader_fitnessScore);
					//System.out.println("personal_space: " + personalSpace_fitnessScore);
					/*
					System.out.println("personal_space: " + personalSpace_fitnessScore);
					System.out.println("Follow leader fitness s: " + follow_leader_fitnessScore);
					System.out.println("Obstacle avoidance fitness s: " + obstacleAvoidance_fitnessScore);
					System.out.println("exceed_AngleTurn_fitnessScore: " + exceed_AngleTurn_fitnessScore);
					System.out.println("overall score: " + fitnessMetric);
					System.out.println("////////////////////");
					*/
				}
			}
				
			Agent dummy = null;
			
			//After all agent finishes one timestep, now update current values = current next
			for (Agent a: agents)
			{				
				
				a.position_previous = a.position;
				
				//a.energy -= (int) Math.sqrt(Math.pow(a.position.x - a.position_next.x, 2) + Math.pow(a.position.y- a.position_next.y, 2));
				a.position = a.position_next;
				
				//Check how many degree that the agent change at each time step
				//turn_Angle_fitnessScore
				int angle_change = Math.abs(a.heading.value - a.heading.value_next);
				
				
				if (angle_change > 180)
				{
					angle_change = 360 - angle_change;
				}
				
				if (agents.size() > 1)
					turn_Angle_fitnessScore += angle_change;
				
				//SpaceHeadingEntity dummy_heading_distance = new SpaceHeadingEntity(0,0,0,0,0,0,0);
				//a.energy -= dummy_heading_distance.getdistanceAngle(a.heading.value, a.heading.value_next);
				
				
				if (a.energy > 0)
				{
					a.heading.value = a.heading.value_next;
				}
				
				
				if (a.energy <= 0)
				{
					a.speed.value = 0;
					a.position = a.position_previous;
				}
				else
				{
					a.speed.value = a.speed.value_next;
				}
				
				
				a.distance_to_goal.value = a.distance_to_goal.value_next;
				
				//Get the next zone for agent
				//Set zone value
				/*
				for (Zone z : Main.zones)
				{
					
					if (a.getCurrentZone(z) != 0)
					{
						a.zone_goal.value = z.ID;
						break;
					}

				}
				*/
				
				boolean in_zone = false;
				//Set zone values
				for (Goal g : Main.goals)
				{
					if (g instanceof Goal_rectangle)
					{
						if (a.getCurrentZone((Goal_rectangle) g) != 0)
						{
							a.zone_in.value = g.type.value;
							in_zone = true;
						}
					}	
				}
				
				//Default zone - if agent in not inside any prezone set
				if (in_zone == false)
				{
					a.zone_in.value = -3.0;
				}
				
				//target_agent.zone.value = target_agent.zone.value_next;
			}
			
			
			//Obstacle now can move as well
			for (Obstacle o: obstacles)
			{
				if (o instanceof Obstacle_circle)
				{
					
					Agent a = new Agent();
					Obstacle_circle o_c = (Obstacle_circle) o;
					
					
					if (i % 150 == 0 && i != 0)
					{
						
						Random rand = new Random();
						ArrayList<Integer> angle_change_list = new ArrayList<Integer>(Arrays.asList(15,30,45,60,75,90,120,150,180));
						int angle_change = angle_change_list.get(rand.nextInt(angle_change_list.size()));
						o_c.heading += angle_change;	
						
						//o_c.heading += 90;
						
						ArrayList<Double> speed_change_list = new ArrayList<Double>(Arrays.asList(1.0,1.5,2.0));
						double speed_change = speed_change_list.get(rand.nextInt(speed_change_list.size()));
						//o_c.speed = speed_change;
						
					}
					
					/*
					if (i == 180 || i == 450)
					{
						o_c.heading += 180;	
					}
					*/
					
					o_c.pos = a.position.setNextPositionFromAngleAndSpeed(o_c.pos, o_c.heading, o_c.speed);
				}
			}
			
			//Goal point now can move as well
			for (Goal g: goals)
			{
				if (g instanceof Goal_point)
				{

					Goal_point g_p = (Goal_point) g;

					/*
					if (i % 320 == 0 && i != 0)
					//if (i % 2 == 0)
					{	
						
						Random rand = new Random();
						
						ArrayList<Integer> angle_change_list = new ArrayList<Integer>(Arrays.asList(30,60,90,120,150,180,210,240,270,300,330));
						int angle_change = angle_change_list.get(rand.nextInt(angle_change_list.size()));
						g_p.heading = angle_change;
						
						
						//g_p.heading = 90 ;	
						
						
						ArrayList<Double> speed_change_list = new ArrayList<Double>(Arrays.asList(0.0, 1.0, 2.0));
						double speed_change = speed_change_list.get(rand.nextInt(speed_change_list.size()));
						//g_p.speed = 1;
						
	
					}
					*/
					
					/*
					if (i == 400 && i != 0)
					{
						g_p.speed = 0;
						g_p.heading = 0 ;	
					}
					
					if (i >= 500 && i != 0)
					{
						g_p.speed = 0;
						g_p.heading = 0 ;	
					}
					*/
					
					/*
					if (i >= 0 && i < 150)
					{
						g_p.speed = 2;
						
					}
					else if (i >= 150 && i < 300)
					{
						g_p.speed = 1;
						
					}
					else if (i >= 300 && i < 400)
					{
						g_p.speed = 2.5;
						
					}
					else if (i >= 400 && i < 500)
					{
						g_p.speed = 2;
						
					}
					else 
					{
						g_p.speed = 0;
						
					}
					*/
					
					
					/*
					if (i  == 250)
					{
						g_p.heading += 90;
						g_p.speed = 1;
					}
					*/
					
					
					
					g_p.position = g_p.position.setNextPositionFromAngleAndSpeed(g_p.position, g_p.heading, g_p.speed);
				}
			}
			
			//Shuffle agent list so that there is no priority between agents.
			if (Main.global_var.random_no_seed == true)
			{
				//Collections.shuffle(agents);
				
				for (Agent a : agents)
				{
					a.priority = a.position.getDistanceBetween2Position(a.position, new Position(150,136));
				}
			}
			
			// Sort models base on fitnessMetric
			//Collections.sort(agents, new SortbyPriority());
			
			Agent highest_property_agent = null;

			highest_property_agent = agents.get(0);
			dummy = agents.get(0);
			
			
			/*
			//Check if agents are overlap each other, if yes, speed = 0 and position will not be updated.
			if (global_var.agent_overlap == false)
			{
				
				for (Agent a1 : agents)
				{
					//if (highest_property_agent.equals(a1) == false)
					{
						for (Agent a2 : agents)
						{
							if (a1 != a2)
							{
								Position agentA_pos, agentB_pos;

								agentA_pos = a1.position;
								
								agentB_pos = a2.position;

								double temp_x = agentA_pos.x - agentB_pos.x;
								double temp_y = agentA_pos.y - agentB_pos.y;

								double dis = Math.sqrt(Math.pow((temp_x),2) + Math.pow(temp_y,2));

								if (dis < Main.global_var.agent_personal_space -0.5)
								{

									double temp_x_pre = a1.position_previous.x - a2.position_previous.x;
									double temp_y_pre = a1.position_previous.y - a2.position_previous.y;

									double dis_pre = Math.sqrt(Math.pow((temp_x_pre),2) + Math.pow(temp_y_pre,2));

									//IF agent somehow get overlap
									//Only stop if the next move get these 2 agents more overlap
									
									//Set a small behavior to check if nothing in front of an agent, then it can move forward
									Activation activation = new Activation();

									ArrayList<Filter> filter_chain = new ArrayList<Filter>();
									filter_chain.add(new Filter_ranged(1,0,10,0));
									filter_chain.add(new Filter_ranged(2.1,-90,90,0));

									ArrayList<ArrayList<Entity>> temp_1 = new ArrayList<ArrayList<Entity>>();

									temp_1 = a1.fov.getEntityWithinFOV(entities, a1, i);
									ArrayList<Entity> neighbor_e_a1 = temp_1.get(0);
									
									ArrayList<Entity> return_e_a1 = Main.utility.getFilteredAgents(filter_chain, a1, neighbor_e_a1, i);


									if (a1.speed.value >= 0)
									{
										if (return_e_a1.size() != 0)
										{
											//if (dis_pre < dis)
											{
												if ((highest_property_agent.equals(a1) == false))
												{
													//System.out.println("Agent bump but waive because the agent has the highest priority");
												}
												else
												{
													a1.speed.value = 0;
													speedMetric_fitnessScore++;
													a1.position = a1.position_previous;
													collision_fitnessScore++;
												}
											}
												

										}

											//System.out.println("Agent bump");
										
									}
									else
									{
										if ((highest_property_agent.equals(a1) == false))
										{
											//System.out.println("Agent bump but waive because the agent has the highest priority");
										}
										else
										{
											a1.speed.value = 0;
											speedMetric_fitnessScore++;
											a1.position = a1.position_previous;
											collision_fitnessScore++;
										}
										

									}


									ArrayList<ArrayList<Entity>> temp_2 = new ArrayList<ArrayList<Entity>>();
									temp_2 = a2.fov.getEntityWithinFOV(entities, a2, i);
									ArrayList<Entity> neighbor_e_a2 = temp_2.get(0);
									
									ArrayList<Entity> return_e_a2 = Main.utility.getFilteredAgents(filter_chain, a2, neighbor_e_a2, i);


									if (a2.speed.value >= 0)
									{
										if (return_e_a2.size() != 0)
										{
											a2.speed.value = 0;
											speedMetric_fitnessScore++;
											a2.position = a2.position_previous;
											collision_fitnessScore++;

											//System.out.println("Agent bump");
										}
									}
									else
									{

										a2.speed.value = 0;
										speedMetric_fitnessScore++;
										a2.position = a2.position_previous;
										collision_fitnessScore++;
									}
								}
							}

						}
					}
					
				}
			}
			*/
			
			if (global_var.agent_overlap == false)
			{
				for (Obstacle o : obstacles)
				{
					if (o instanceof Obstacle_rectangle)
					{
						double threshold = 0;
						
						Obstacle_rectangle or = (Obstacle_rectangle) o;
						
						for (Agent a: agents)
						{
							Position p = a.position;
							
							int size = Main.global_var.agent_radius - 1;
						
							//If a position is inside fat rectangle obstacle
							if (p.x >= or.pos1.x - size && p.x <= or.pos2.x + size && p.y >= or.pos1.y - size && p.y <= or.pos4.y + size)
							{
								//If a position inside a fat rectangle
								//But in the corner area.
								if ( (p.x < or.pos1.x && p.y < or.pos1.y) || 
									(p.x > or.pos2.x && p.y < or.pos2.y) ||
									(p.x > or.pos3.x && p.y > or.pos3.y) ||
									(p.x < or.pos4.x && p.y > or.pos4.y)
									)
								{
									
									//If one of the corner is inside agents, we can give a loose restriction here
									ArrayList<Position> corner_pos = new ArrayList<Position>();
									
									corner_pos.add(or.pos1);
									corner_pos.add(or.pos2);
									corner_pos.add(or.pos3);
									corner_pos.add(or.pos4);
									
									//Deal with corner
									for (Position p_c: corner_pos)
									{
										double distance = Math.sqrt(Math.pow(p.x - p_c.x, 2) + Math.pow(p.y - p_c.y, 2));
										
										if (distance < size - 0.1)
										{
											
											a.speed.value = 0;
											speedMetric_fitnessScore++;
											a.position = a.position_previous;
											//System.out.println("Wall bump");
											collision_fitnessScore++;



										}
									}
								}
								else
								{
									
									a.speed.value = 0;
									speedMetric_fitnessScore++;
									a.position = a.position_previous;
									//System.out.println("Wall bump");
									collision_fitnessScore++;

									
									
								}

							}
							
						
						}
					}
					else if (o instanceof Obstacle_circle)
					{
						Obstacle_circle e_c = (Obstacle_circle) o;
						
						for (Agent a: agents)
						{
							Double dis = Math.sqrt(Math.pow(a.position.x - e_c.pos.x, 2) + Math.pow(a.position.y - e_c.pos.y, 2));
							
							if (dis < e_c.radius + Main.global_var.agent_radius - 5)
							{
								//a.speed.value = 0;
								speedMetric_fitnessScore++;
								a.position = a.position_previous;
								//System.out.println("Circle bump");
								collision_fitnessScore++;
							}
						}
					}
				}
			}
			
			
			
			
			//Remove for agent list
			//agents.removeIf(a -> (a.position.x <= 0 || a.position.x >= global_var.WorldSize_width || a.position.y <= 0 || a.position.y >= global_var.WorldSize_height));
			
			ArrayList<Agent> remove_agent = new ArrayList<Agent>();
			
			if (agents.size() >= 0)
			{
				//Remove agent list when they reach a goal
				
				for (Entity e: entities)
				{
					if (e instanceof Goal_rectangle)
					{
						
						Goal_rectangle gr = (Goal_rectangle) e;
						
						if (gr.remove_agent == true)
						{
							for (Entity e1: entities)
							{
								if (e1 instanceof Agent)
								{
									Agent a = (Agent) e1;
									
									if (a.position.x >= gr.zone_goal.pos1.x && a.position.x <= gr.zone_goal.pos2.x
									&&  a.position.y >= gr.zone_goal.pos1.y && a.position.y <= gr.zone_goal.pos4.y)
									{
										if (finish_insideDestinationZone_fitnessScore == false)
											insideDestinationZone_fitnessScore++;
										
										remove_agent.add(a);
									}
								}
							}
						}
						
					}
				}
				
				//Remove for agent list for out of bound option
				for (Entity e: entities)
				{
					if (Main.global_var.worldWarp == false)
					{
						//Agent type
						if(e instanceof Agent)
						{
							Agent a = (Agent) e;
							
							dummy = a;
							
							if (a.position.x <= 0 || a.position.x >= global_var.WorldSize_width || a.position.y <= 0 || a.position.y >= global_var.WorldSize_height)
							{
								//Has initial heading = 0
								if (a.type.value == 1)
								{
									//Out of bound on the right side
									if (a.position.x >= global_var.WorldSize_width) 
									{
										//Make sure is is remove while in the hall way/not wall
										if (a.position.y >= 50 || a.position.y <= 320)
										{
											if (finish_insideDestinationZone_fitnessScore == false)
												insideDestinationZone_fitnessScore++;
										}
										else
										{
											if (finish_insideDestinationZone_fitnessScore == false)
												insideDestinationZone_fitnessScore -= 5;
										}
									}
									//Out of bound on the left side
	 								else if (a.position.x <= 0)
									{
										//Make sure is is remove while in the hall way/not wall
										if (a.position.y >= 50 || a.position.y <= 320)
										{
											if (finish_insideDestinationZone_fitnessScore == false)
												insideDestinationZone_fitnessScore -=5;
										}
										else
										{
											if (finish_insideDestinationZone_fitnessScore == false)
												insideDestinationZone_fitnessScore-=5;
										}
									}
									
									
								}
								//Has initial heading = 180
								else if (a.type.value == 1.1)
								{
									//Out of bound on the left side
									if (a.position.x <= 0)
									{
										//Make sure is is remove while in the hall way/not wall
										if (a.position.y >= 50 || a.position.y <= 320 )
										{
											if (finish_insideDestinationZone_fitnessScore == false)
												insideDestinationZone_fitnessScore++;
										}
										else
										{
											if (finish_insideDestinationZone_fitnessScore == false)
												insideDestinationZone_fitnessScore-=5;
										}
									}
									//Out of bound on the right side
									else if (a.position.x >= global_var.WorldSize_width)
									{
										//Make sure is is remove while in the hall way/not wall
										if (a.position.y >= 50 || a.position.y <= 320)
										{
											if (finish_insideDestinationZone_fitnessScore == false)
												insideDestinationZone_fitnessScore-=5;
										}
										else
										{
											if (finish_insideDestinationZone_fitnessScore == false)
												insideDestinationZone_fitnessScore-=5;
										}
									}
									
								}
								
								//Out of bound of up and down side
	 							if (a.position.y <= 0 || a.position.y >= global_var.WorldSize_height)
								{
									if (finish_insideDestinationZone_fitnessScore == false)
										insideDestinationZone_fitnessScore--;
								}
								
								remove_agent.add(a);
								
							}
						}
					}
					
					
					//System.out.println(insideDestinationZone_fitnessScore);
				}
			}
			
			
			
			entities.removeAll(remove_agent);
			agents.removeAll(remove_agent);
			
			through_put_rate += remove_agent.size();
			
			if (agents.size() == 0)
			{
				agents.add(dummy);
				entities.add(dummy);
			}
			
			//System.out.println ("# agents after"  + agents.size());
			
			if (Main.global_var.simulation_Draw == true)
			{
				//System.out.println("t = " + i);
				sim.classifyEntity(entities, zones, agentGenerator, stored_agent_pos_his, FOV_segment_dataStruct_list, heading_direction_list_for_special_agent, heading_static, through_put_rate);
				
				heading_static.clear();
				for (Entity e : entities)
				{
					if (e instanceof Agent)
					{
						Agent a = (Agent) e;
						
						stored_agent_pos_his.add(new Position(a.position.x, a.position.y));
						
					}
				}
				
				sim.repaint();
            	Thread.sleep(20);
			}
			
			if (Main.global_var.simulation_Draw == true)
			{
				
			}

		}
		

	}
	
	public double normalize_score(double value, double max, double min)
	{
		double return_value = 0;
		
		if (value >= max)
		{
			value = max;
		}
		
		if (value <= min)
		{
			value = min;
		}
		
		return_value = (max - value)/(max-min);
		
		
		if (return_value == 0)
		{
			return_value = 0.000000001;
		}
		
		
		
		return return_value;
	}
	
	public double normalize_score_type2(double value, double max, double min)
	{
		double return_value = 0;
		
		if (value > min && value < max)
		{
			return_value = 1;
		}
		else
		{
			return_value = 0.000000001;
		}
		
		return return_value;
	}
	
	public double normalize_score_dynamicFitness(double value, double max, double min, int gen_th)
	{
		double return_value = 0;
		
		if (value >= max)
		{
			value = max;
		}

		return_value = (max - ((double)gen_th/(double)global_var.num_generation)*value)/max;
		
		if (return_value == 0)
		{
			return_value = 0.000000001;
		}
		
		return return_value;
	}
	
	//For now, right and left turn must have the same value
	public double getMaxAngleTurn_new(Agent target_agent, int current_heading, int next_heading, double max_turn)
	{	
				
		double distance_angle_to_right = 0;
		double distance_angle_to_left = 0;
		
		int count = current_heading;
		//Check distance on the right first
		while(count != next_heading)
		{
			distance_angle_to_right++;
			count++;
			
			//System.out.println("R" + count);
			
			if (count > 359)
			{
				count = 0;
			}
			
			if (count == next_heading)
			{
				break;
			}
		}
		
		count = current_heading;
		
		//Check distance on the left
		while(count != next_heading)
		{
			distance_angle_to_left++;
			count--;
			//System.out.println("L" + count);
			
			if (count < 0)
			{
				count = 359;
			}
			
			if (count == next_heading)
			{
				break;
			}
		}
		
		double max_turn_keeptrack = 30;
		
		//When both direciton turning is not less than max
		if (distance_angle_to_right > max_turn_keeptrack && distance_angle_to_left > max_turn_keeptrack)
		{
			//If turn right angle < turn left angle-> agent turn right
			if (distance_angle_to_right < distance_angle_to_left)
			{
				//System.out.println("Spend energy");
				
				//If agent turn more than max_turn_keeptrack -> speed energy
				target_agent.energy -= (distance_angle_to_right - 30);
				
				//If agent turn more than max_turn_keeptrack -> add penalty
				exceed_AngleTurn_fitnessScore += (distance_angle_to_right - 30);
				
				if (target_agent.energy < 0)
				{
					
					target_agent.energy = 0;
				}
			}
			//otherwise, agent turn left
			else
			{				
				//System.out.println("Spend energy");
				//If agent turn more than max_turn_keeptrack -> speed energy
				target_agent.energy -= (distance_angle_to_left - 30);	
				
				
				//If agent turn more than max_turn_keeptrack -> add penalty
				exceed_AngleTurn_fitnessScore += (distance_angle_to_left - 30);
				
				if (target_agent.energy < 0)
				{
					
					target_agent.energy = 0;
				}
			
			}
		}
		
		//as long as one of 2 direction turning is smaller than max turn
		// agent can go ahead and turn
		if (distance_angle_to_right <= max_turn || distance_angle_to_left <= max_turn)
		{
			current_heading =  next_heading;
			return current_heading;
		}
		//When both direciton turning is not less than max
		else
		{
			//If turn right angle < turn left angle-> agent turn right
			if (distance_angle_to_right < distance_angle_to_left)
			{

				current_heading += max_turn;
				return checkAngle(current_heading);
			}
			//otherwise, agent turn left
			else
			{
				//System.out.println("Turn  distance: " + distance_angle_to_left);
				//real_turn_angle += distance_angle_to_left;
				
				current_heading -= max_turn;
				return checkAngle(current_heading);
			}
		}
		
		
	}
	
	public int getNextAverage_Heading_withWeight(Agent target_agent, ReturnVar return_var)
	{
		
		int next_heading = 0;
		double sumSin = 0;
		double sumCos = 0;
		
		ArrayList<Double> angle_value_list = new ArrayList<Double>();
		ArrayList<Double> weight_list = new ArrayList<Double>();
		
		int sum_weight = 0;
		//Normalize and put weight to the decision
		for (int k = 0; k < return_var.heading_direction.size(); k++)
		{
			//System.out.println("Remember to change weight back");
			sum_weight += return_var.heading_direction.get(k).weight;

			//Add angle value to list
			angle_value_list.add(return_var.heading_direction.get(k).value);
			//Add weight value to list
			weight_list.add(return_var.heading_direction.get(k).weight);
			//weight_list.add(1.0);
			//angle_value_list.add(angle);
		}
		
		if (sum_weight > 0)
		{
			int count = 0;
			for (Double heading : angle_value_list)
			{
				
				heading *= Math.PI/180;
				sumSin += Math.sin(heading)*(weight_list.get(count)/sum_weight);
				sumCos += Math.cos(heading)*(weight_list.get(count)/sum_weight);
				
				if (Main.global_var.search_Model == false)
				{
					double weight = weight_list.get(count)/sum_weight;
					
					if (count == 0)
					{
						weight_B0.add(weight);
					}
					else if (count == 1)
					{
						weight_B1.add(weight);
					}
					else if (count == 2)
					{
						weight_B2.add(weight);
					}
				}
				
				count++;
			}
			
			
			double next_headingInRad = Math.atan2(sumSin, sumCos);
			
			next_heading = (int) (next_headingInRad*180/Math.PI);
			
			if (next_heading < 0)
			{
				next_heading += 360;
			}
			
			
		}
		//sum_weight = 0 means all angle behaviors has weight = 0
		//=> means heading unchanged
		else
		{
			next_heading = target_agent.heading.value;
		}
		
		return next_heading;
	}
	
	
	public double getNextAverage_numericValue_withWeight(Agent target_agent, ReturnVar return_var)
	{
		double next_speed = 0;
		
		ArrayList<Double> speed_value_list = new ArrayList<Double>();
		ArrayList<Double> weight_list = new ArrayList<Double>();
		
		double sum_weight = 0;
		
		for (int k = 0; k < return_var.speed.size(); k++)
		{
			sum_weight += return_var.speed.get(k).weight;
			speed_value_list.add(return_var.speed.get(k).value);
			weight_list.add(return_var.speed.get(k).weight);
			
		}
		
		if (sum_weight > 0)
		{
			for (int k = 0; k < return_var.speed.size(); k++)
			{
				next_speed += speed_value_list.get(k)*(weight_list.get(k)/sum_weight);
			}
			
			//next_speed += target_agent.speed.value;
		}
		//sum_weight = 0 means all speed behaviors has weight = 0
		//=> means speed unchanged
		else
		{
			next_speed = target_agent.speed.value;
		}
		
		
		//next_speed = target_agent.speed.value;
		
		//next_speed = target_agent.speed.value + 2;
		
		Property_numeric s = (Property_numeric) target_agent.speed;
		
		if (next_speed >= s.upperRange)
		{
			next_speed = s.upperRange;
		}
		
		if (next_speed <= s.lowerRange)
		{
			next_speed = s.lowerRange;
		}
		return next_speed;
		
	}
	
	
	public int checkAngle(int current_heading)
	{
		
		if (current_heading > 360 || current_heading < 0)
		{
			current_heading = Math.abs( Math.abs(current_heading) - 360);
		}
		
		return current_heading;
	}
	
	
	public double getMaxSpeedChange(double current_speed, double next_speed, Constraint c)
	{		
		//Speed decrease in next time step
		if (current_speed > next_speed)
		{
			if (Math.abs(current_speed - next_speed) > Math.abs(c.max_decrease))
			{
				//Need to bound min speed
				
				//current speed is decreased beyond min value
				if (current_speed - c.max_decrease < c.min_value)
				{
					return c.min_value;
				}
				else
				{
					return current_speed - c.max_decrease;	
				}
			}
			else
			{
				return next_speed;
			}
		}
		//Speed increase
		else
		{
			if (Math.abs(next_speed - current_speed) > c.max_increase)
			{
				//current speed is increased beyond max value 
				if(current_speed + c.max_increase > c.max_value)
				{
					return c.max_value;
				}
				else
				{
					return current_speed + c.max_increase;
				}
				
			}
			else
			{
				return next_speed;
			}
		}
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

@SuppressWarnings("serial")
class DrawWorld extends JPanel 
{

	ArrayList<Entity> entities = new ArrayList<Entity>();
	ArrayList<Agent> agents = new ArrayList<Agent>();
	ArrayList<Zone> zones = new ArrayList<Zone>();
	ArrayList<Obstacle> obstacles = new ArrayList<Obstacle>();
	ArrayList<Goal> goals = new ArrayList<Goal>();
	ArrayList<agentGenerator> generators = new ArrayList<agentGenerator>();
	ArrayList<Position> pos_history = new ArrayList<Position>();
	ArrayList<FOV_segment_dataStructure> FOV_segment_dataStruct_list = new ArrayList<FOV_segment_dataStructure>();
	ArrayList<DataStruct_ReserveProperty> heading_direction_list_for_special_agent = new ArrayList<DataStruct_ReserveProperty>();
	ArrayList<SpaceHeadingEntity> heading_static = new ArrayList<SpaceHeadingEntity>();
	int through_put_rate = 0;
	
	public void classifyEntity(ArrayList<Entity> entity_add, ArrayList<Zone> zones_add, ArrayList<agentGenerator> gen_add, ArrayList<Position> pos_his, ArrayList<FOV_segment_dataStructure> FOV_segment_dataStruct_l, ArrayList<DataStruct_ReserveProperty> heading_list, ArrayList<SpaceHeadingEntity> h_static, int through_put_r)
	{
		agents = new ArrayList<Agent>();
		zones = new ArrayList<Zone>();
		obstacles = new ArrayList<Obstacle>();
		goals = new ArrayList<Goal>();
		generators = new ArrayList<agentGenerator>();
		entities = new ArrayList<Entity>();
		pos_history = new ArrayList<Position>();
		FOV_segment_dataStruct_list = new ArrayList<FOV_segment_dataStructure>();
		heading_direction_list_for_special_agent = new ArrayList<DataStruct_ReserveProperty>();
		heading_static = new ArrayList<SpaceHeadingEntity>();
		through_put_rate = through_put_r;
		
		for (Entity e: entity_add)
		{	
			
			
			//Agent type
			if(e instanceof Agent)
			{
				((Agent) e).sense = false;
				agents.add((Agent) e);
			}
			//Obstacle type
			else if (e instanceof Obstacle)
			{
				obstacles.add((Obstacle) e);
			}
			//Goal type
			else if (e instanceof Goal)
			{
				goals.add((Goal) e);
			}
			
			entities.add(e);
		}
		
		for (Zone z : zones_add)
		{
			zones.add(z);
		}
		
		for (agentGenerator gen : gen_add)
		{
			generators.add(gen);
		}
		
		for (Position p : pos_his)
		{
			pos_history.add(p);
		}
		
		for (FOV_segment_dataStructure fsd : FOV_segment_dataStruct_l)
		{
			FOV_segment_dataStruct_list.add(fsd);
		}
		
		for (DataStruct_ReserveProperty h: heading_list)
		{
			heading_direction_list_for_special_agent.add(h);
		}
		
		for (SpaceHeadingEntity h: h_static)
		{
			heading_static.add(h);
		}
	}
	
	@Override
	public void paint(Graphics g) 
	{
		
		super.paint(g);
		Graphics2D g2d = (Graphics2D) g;
		g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING,RenderingHints.VALUE_ANTIALIAS_ON);
		
		int diameter = Main.global_var.agent_radius * 2;
		
		//DRAW zones	
		
		/*
		for (Zone z : zones)
		{
			if (z instanceof Zone_rectangle)
			{
				Zone_rectangle z_rec = (Zone_rectangle) z;
				if (z.ID == 1 || z.ID == 2.1)
				{
					Color myColour = new Color(0, 0, 250, 20);
					g.setColor(myColour);
					g.fillRect((int)z_rec.pos1.x, (int)z_rec.pos1.y, z_rec.width, z_rec.height);
				}
				else if (z.ID == 2 || z.ID == 1.1)
				{
					Color myColour = new Color(0, 0, 250, 40);
					g.setColor(myColour);
					g.fillRect((int)z_rec.pos1.x, (int)z_rec.pos1.y, z_rec.width, z_rec.height);
				}
				else if (z.ID == 3)
				{
					Color myColour = new Color(0, 0, 250, 60);
					g.setColor(myColour);
					g.fillRect((int)z_rec.pos1.x, (int)z_rec.pos1.y, z_rec.width, z_rec.height);
				}
			}
			if (z instanceof Zone_triangle)
			{
				Zone_triangle z_tri = (Zone_triangle) z;
				g.drawPolygon(z_tri.x_list, z_tri.y_list, 3);
			}
		
		}
		 */

		//DRAW obstacles
		for (Obstacle o : obstacles)
		{
			if (o instanceof Obstacle_rectangle)
			{
				Obstacle_rectangle o1 = (Obstacle_rectangle) o;
				Color myColour = new Color(0, 0, 0, 180);
				g.setColor(myColour);
				g.fillRect((int)o1.pos1.x, (int)o1.pos1.y, o1.width, o1.height);
			}
			else if (o instanceof Obstacle_circle)
			{
				Obstacle_circle o1 = (Obstacle_circle) o;
				Color myColour = new Color(0, 0, 0, 180);
				g.setColor(myColour);
				
				int center_X = (int) o1.pos.x;
				int center_Y = (int) o1.pos.y;
				
				int oval_X = (int) (center_X - o1.radius);
				int oval_Y = (int) (center_Y - o1.radius);

				g.fillOval(oval_X, oval_Y, o1.radius*2, o1.radius*2);
			}

		}
		
		
		//DRAW source
		/*
		for (agentGenerator gen : generators)
		{
			int oval_X = (int) (gen.position.x - diameter/2.0);
			int oval_Y = (int) (gen.position.y - diameter/2.0);
			
			g.setColor(Color.black);
			g.drawOval(oval_X, oval_Y, 10, 10);
		}
		*/
				
		for (int i = 0; i < agents.size(); i++)
		{
			//Draw agent's path
			
			for (Position p : pos_history)
			{

				//g.fillOval((int)p.x, (int)p.y, 1,1);
			}
			
			int center_X = (int) agents.get(i).position.getX();
			int center_Y = (int) agents.get(i).position.getY();

			//drawOval will take the corner UP LEFT as position, not center or the oval
			int oval_X = (int) (center_X - diameter/2.0);
			int oval_Y = (int) (center_Y - diameter/2.0);

			//Get heading direction from agent
			int heading = agents.get(i).heading.value;

			//Get position from a heading angle
			//Heading need to be converted from degree to radians
			double changeinX = diameter/2 * Math.cos(Math.toRadians(heading));
			double changeinY = diameter/2 * Math.sin(Math.toRadians(heading)) * -1;

			//Get the end position to draw a line - represent for heading direction
			int end_X = (int) (agents.get(i).position.getX() + changeinX);
			int end_Y = (int) (agents.get(i).position.getY() + changeinY);
			
			
			if(i == Main.global_var.specialAgent)
			{
				//////////Draw field of view for the special agent////////////////
				if (Main.global_var.fov_Draw == true)
				{
					ArrayList<FOV_segment> FOV_segment_list = agents.get(i).fov.getFOVZoneSegment(agents.get(i));
					
					double distance_fov = agents.get(i).fov.getViewDistance();
					int angle_fov = agents.get(i).fov.getViewAngle();
					
					for (FOV_segment fov : FOV_segment_list)
					{
						//Draw 1st line - the one on the left
						//int angle_fov_left = heading + angle_fov/2;
						int angle_fov_left = fov.range_end;
						int changeinX_fov = (int) (distance_fov * Math.cos(Math.toRadians(angle_fov_left)));
						int changeinY_fov = (int) (distance_fov * Math.sin(Math.toRadians(angle_fov_left)) * -1);

						int end_X_fov = (int)(agents.get(i).position.getX() + changeinX_fov);
						int end_Y_fov = (int)(agents.get(i).position.getY() + changeinY_fov);

						g.drawLine(center_X, center_Y, end_X_fov, end_Y_fov);

						//Draw 2nd line - the one on the right
						//int angle_fov_right = heading - angle_fov/2;
						int angle_fov_right = fov.range_start;
						changeinX_fov = (int) (distance_fov * Math.cos(Math.toRadians(angle_fov_right)));
						changeinY_fov = (int) (distance_fov * Math.sin(Math.toRadians(angle_fov_right)) * -1);

						end_X_fov = (int)(agents.get(i).position.getX() + changeinX_fov);
						end_Y_fov = (int)(agents.get(i).position.getY() + changeinY_fov);

						g.drawLine(center_X, center_Y, end_X_fov, end_Y_fov);

						//Draw aiming point - where the special agent aims to head to
						//g.fillOval((int)agents.get(i).position.getX()-4, (int)agents.get(i).position.getY()-4, 8, 8);
					}
					
					//Draw the arc
					/////////////////////////////////////////////////////////////
					int arc_fov_X = (int) (center_X - distance_fov);
					int arc_fov_Y = (int) (center_Y - distance_fov);
					
					int angle_fov_right = heading - angle_fov/2;
					
					//distance_foc needs to be double because grawArc need diameter, not radius
					g.drawArc(arc_fov_X, arc_fov_Y, (int) distance_fov*2, (int) distance_fov*2, angle_fov_right, angle_fov);
					
					int oval_X_personal_space = (int) (center_X - Main.global_var.agent_personal_space);
					int oval_Y_personal_space = (int) (center_Y - Main.global_var.agent_personal_space);

					//Draw personal space
					//g.drawOval(oval_X_personal_space, oval_Y_personal_space, global_var.agent_personal_space*2,global_var.agent_personal_space*2);

					//area
					//g.drawLine(global_var.WorldSize_width/2, 0, global_var.WorldSize_width/2, global_var.WorldSize_height);
					//g.drawLine(0,global_var.WorldSize_height/2, global_var.WorldSize_width, global_var.WorldSize_height/2);
				
					
					
					int count = 0;
					
					
					for (int h = 0; h < heading_static.size(); h++)
					{
						int heading_s = (int) heading_static.get(h).heading;
						double distance = 0;
						
						if (heading_static.get(h).distance_travel >= 0)
						{
							distance = heading_static.get(h).distance_travel_to_goal_points;
						}
						
						
						//System.out.println(heading_s + " " + distance);
						int changeinX_fov = (int) (distance * Math.cos(Math.toRadians(heading_s)));
						int changeinY_fov = (int) (distance * Math.sin(Math.toRadians(heading_s)) * -1);
						
						int end_X_fov = (int)(agents.get(i).position.getX() + changeinX_fov);
						int end_Y_fov = (int)(agents.get(i).position.getY() + changeinY_fov);
						
						g2d.setStroke(new BasicStroke(2));
						
						Color myColour = new Color(250, 0, 0, 100);
						
						g2d.setColor(myColour);
						
						g2d.drawLine(center_X, center_Y, end_X_fov, end_Y_fov);
					}
					
				}

				g2d.setStroke(new BasicStroke(1));
				
				g.setColor(Color.black);
				//Draw agent
				

					g.drawOval(oval_X, oval_Y, diameter, diameter);

					g.drawLine(center_X, center_Y, end_X, end_Y);
				
				
				
				
			}
			else 
			{
				g2d.setStroke(new BasicStroke(1));
				g.setColor(Color.black);
				//Draw agent

				g.drawOval(oval_X, oval_Y, diameter, diameter);

				g.drawLine(center_X, center_Y, end_X, end_Y);
				
			}
			
			agents.get(i).type.value = 1.0;
		}
		

		//g.drawOval(147-60, 125-60, 120, 120);
		//g.fillOval(183, 125, 3, 3);key
		//g.fillOval(144, 149, 3, 3);
		//g.fillOval(150, 147, 3, 3);
		
		//g.fillOval(30, 149, 3, 3);
		//g.fillOval(30, 51, 3, 3);
		/*
		int size = 25;
		g.drawRect(115, 72, size, size);
		g.drawRect(85, 91, size, size);
		g.drawRect(65, 121, size, size);
		g.drawRect(85, 152, size, size);
		g.drawRect(115, 170, size, size);
		*/

		//String though_put_rate_string = "R: " + String.valueOf(through_put_rate);
		//g2d.drawString(though_put_rate_string, 200, 80);
		//String next_heading_string = "NH: " + String.valueOf(special_agent_heading);

		
		//g2d.drawString(next_heading_string, 200, 100);
		 
		for (Goal go: goals)
		{
			if (go instanceof Goal_point)
			{
				Goal_point go_p = (Goal_point) go;
				//drawOval will take the corner UP LEFT as position, not center or the oval
				int oval_X = (int) (go_p.position.x - diameter/2.0);
				int oval_Y = (int) (go_p.position.y - diameter/2.0);

				if (go_p.type.value == 3.0)
					g.setColor(Color.black);
				else
					g.setColor(Color.blue);

				g.fillOval(oval_X, oval_Y, go_p.radius*2, go_p.radius*2);

			}
			else if (go instanceof Goal_rectangle)
			{
				Goal_rectangle go_r = (Goal_rectangle) go;
				
				if (go_r.type.value == 3.0)
				{
					Color myColour = new Color(0, 0, 250, 150);
					g.setColor(myColour);
					
				}
				
				else if (go_r.type.value == 3.1 || go_r.type.value == 3.4 || go_r.type.value == 3.5)
				{
					Color myColour = new Color(0, 0, 250, 0);
					g.setColor(myColour);
					
				}
				
				
				else if (go_r.type.value == 3.2 || go_r.type.value == 3.3 || go_r.type.value == 3.6 || go_r.type.value == 3.7)
				{
					Color myColour = new Color(0, 0, 250, 100);
					g.setColor(myColour);
					
				}
				else
				{
					Color myColour = new Color(0, 0, 250, 20);
					g.setColor(myColour);
					
				}

				//if (go_r.type.value != 3.4 )
				g.fillRect((int)go_r.zone_goal.pos1.x, (int)go_r.zone_goal.pos1.y, go_r.zone_goal.width, go_r.zone_goal.height);
				
			}

		}
		
	}
}

class SortbyPriority implements Comparator<Agent> {
	// Used for sorting in decending order of
	// roll number
	public int compare(Agent a, Agent b) {
		if (a.priority - b.priority < 0) {
			return -1;
		} else if (a.priority - b.priority > 0) {
			return 1;
		} else {
			return 0;
		}
	}
}

class WeightInformation 
{
	double weight_B0 = 0;
	double weight_B1 = 0;
	double weight_B2 = 0;
	int agent_remain;
	
	public WeightInformation (double w0, double w1, double w2, int a_remain)
	{
		this.weight_B0 = w0;
		this.weight_B1 = w1;
		this.weight_B2 = w2;
		this.agent_remain = a_remain;
	}
	
}
