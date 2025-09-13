package Utility;

import java.util.ArrayList;
import java.util.Random;

import Action.SpaceReference_Expand;
import Goal.Goal;
import Goal.Goal_point;
import Goal.Goal_rectangle;
import SpaceHeadingEntity.SpaceHeadingEntity;
import agents.Agent;
import agents.Position;
import agents.Property_numeric;
import behavior.BehaviorGroup;
import core.Main;
import core.Model;
import entities.Entity;
import filters.Filter;
import filters.Filter_method;
import filters.Filter_ranged;
import obstacles.Obstacle;
import obstacles.Obstacle_circle;
import obstacles.Obstacle_rectangle;

public class myUtility 
{
	public myUtility()
	{
		
	}
	
	public ArrayList<Integer> copyArrayList( ArrayList<Integer> input)
	{
		ArrayList<Integer> toReturn = new ArrayList<Integer>( input.size() );
		for (int i = 0; i < input.size(); i++){
			toReturn.add( input.get( i));
		}
		return toReturn;
	}
	
	public ArrayList<Agent> concatAgentArrayList(ArrayList<Agent> a, ArrayList<Agent> b)
	{
		ArrayList<Agent> concatA = new ArrayList<Agent>();
		
		if(a != null)
		{
			for (Agent a_element : a)
			{
				concatA.add(a_element);
			}
			
		}
		
		if(b != null)
		{
			for (Agent b_element : b)
			{
				concatA.add(b_element);
			}
		}
		
		//System.out.println("Size of concatA:" + concatA.size());
		return concatA; 
	}

	public ArrayList<Model> deepCopyArrayListModel(ArrayList<Model> models)
	{
		ArrayList<Model> copy_models = new ArrayList<Model>();
		
		for (Model m:models)
		{
			copy_models.add(m);
		}
		
		return copy_models;
	}
	
	public ArrayList<Entity> getFilteredAgents(ArrayList<Filter> filters, Agent target_agent, ArrayList<Entity> neighbor, int timestep)
	{
		ArrayList<Entity> filtered_entity = new ArrayList<Entity>();
		//ArrayList<Agent> filtered_agent = new ArrayList<>();
		//ArrayList<Agent> filtered_agent_warp = new ArrayList<>();
		
		//The goal is to check all range filtered using O(neighbor.size)
				
		boolean pass_filter = true;
		//For each entity
		for (Entity e : neighbor)
		{	
			//Space Entity has different property 
			//Need to treat it different from the rest
			if (e instanceof SpaceHeadingEntity)
			{
				
			}
			//Idelly, each entity type should have its own process case like SpaceHeading Entity
			else
			{
				//For each filter
				for (Filter f: filters)
				{
					if(f instanceof Filter_ranged)
					{
						Filter_ranged fr = (Filter_ranged) f;
						
						//double extracted_p, Agent target_agent, Entity neighbor_entity, int timesteps)
						double checking_value = getCheckingValue(fr.filtered_p, target_agent, e, timestep);
						
						if (fr.filtered_p == 1 || fr.filtered_p == 2.0 || fr.filtered_p == 2.1 || fr.filtered_p == 2.2 
								|| fr.filtered_p == 3.0)
						{
							pass_filter = fr.filterRanged_Numeric(checking_value, timestep);
							if(pass_filter == false)
								break;
						}
						else if (fr.filtered_p == 4.0 || fr.filtered_p == 4.1 || fr.filtered_p == 5 )
						{
							pass_filter = fr.filterRange_category(checking_value, timestep);
							if(pass_filter == false)
								break;
						}
						
					}	
				}
			}
			
			
			//only true if the neighbor pass all filters except the last one
			if(pass_filter == true)
			{
				filtered_entity.add(e);
			}
		}
		
		//There is one combination method filter at the end of the chain
		if (filters.size() > 0 && filters.get(filters.size() - 1) instanceof Filter_method)
		{

			Filter_method fm = (Filter_method) filters.get(filters.size() - 1);
			
			Entity chosen_one = fm.combination_filter(target_agent, filtered_entity, timestep);
			
			if (chosen_one != null)
			{
				//Combination filter only returns one entity
				filtered_entity.clear();
				
				filtered_entity.add(chosen_one);
			}
			else
			{
				filtered_entity.clear();
			}
		}
		else
		{
			return filtered_entity;
		}
		
		return filtered_entity;
	}

	public double getCheckingValue(double extracted_p, Agent target_agent, Entity neighbor_entity, int timesteps)
	{

		//Get distance
		if(extracted_p == 1)
		{
			double temp_x = 0, temp_y = 0;
			double dis = 0;

			if (neighbor_entity instanceof Agent)
			{
				Agent ne = (Agent) neighbor_entity;
				
				Position temp_position = ne.position;

				if (neighbor_entity.warp == true)
				{
					temp_position = target_agent.position.getWarpPosition(target_agent.position, ne.position);
				}
				
				temp_x = temp_position.getX() - target_agent.position.getX();

				temp_y = temp_position.getY() - target_agent.position.getY();

				//get the distance between target_agent and agent(i)
				dis = Math.sqrt(Math.pow((temp_x),2) + Math.pow(temp_y,2));
			}
			else if (neighbor_entity instanceof Obstacle)
			{
				if (neighbor_entity instanceof Obstacle_rectangle)
				{	
					//Only work for unwarp now
					ReturnSenseObstacle sense_obstacle = target_agent.fov.getRectangleObstacleDistanceWithinFOV(target_agent, target_agent.heading.value, (Obstacle_rectangle) neighbor_entity, timesteps);

					if (sense_obstacle != null)
						dis = sense_obstacle.distance;
				}
				else if (neighbor_entity instanceof Obstacle_circle)
				{
					Obstacle_circle e_c = (Obstacle_circle) neighbor_entity;
					
					Position temp_position = e_c.pos;

					if (neighbor_entity.warp == true)
					{
						temp_position = target_agent.position.getWarpPosition(target_agent.position, e_c.pos);
					}
					
					dis = Math.sqrt(Math.pow(target_agent.position.x - temp_position.x, 2) + Math.pow(target_agent.position.y - temp_position.y, 2)) - e_c.radius;
				}
			}
			else if (neighbor_entity instanceof Goal)
			{
				//Only work with unwarp for now
				if (neighbor_entity instanceof Goal_point)
				{
					Goal_point g = (Goal_point) neighbor_entity;

					temp_x = g.position.getX() - target_agent.position.getX();

					temp_y = g.position.getY() - target_agent.position.getY();

					//get the distance between target_agent and agent(i)
					dis = Math.sqrt(Math.pow((temp_x),2) + Math.pow(temp_y,2));
				}
				else if (neighbor_entity instanceof Goal_rectangle)
				{
					//Will get the position so that the turn angle to the goal is shortest
					Goal_rectangle ng = (Goal_rectangle) neighbor_entity;

					//System.out.println("Get reference from zone: " + ng.type.value);

					//8 cases
					//4 CONNER CASES
					//TOP LEFT
					if (target_agent.position.x < ng.zone_goal.pos1.x && target_agent.position.y < ng.zone_goal.pos1.y)
					{
						//Heading to pos 1
						temp_x = ng.zone_goal.pos1.getX() - target_agent.position.getX();

						temp_y = ng.zone_goal.pos1.getY() - target_agent.position.getY();

						//get the distance between target_agent and agent(i)
						dis = Math.sqrt(Math.pow((temp_x),2) + Math.pow(temp_y,2));

					}
					//TOP RIGHT
					else if (target_agent.position.x > ng.zone_goal.pos2.x && target_agent.position.y < ng.zone_goal.pos1.y)
					{
						//Heading to pos 1
						temp_x = ng.zone_goal.pos2.getX() - target_agent.position.getX();

						temp_y = ng.zone_goal.pos2.getY() - target_agent.position.getY();

						//get the distance between target_agent and agent(i)
						dis = Math.sqrt(Math.pow((temp_x),2) + Math.pow(temp_y,2));
					}
					//BOTTOM RIGHT
					else if (target_agent.position.x > ng.zone_goal.pos2.x && target_agent.position.y > ng.zone_goal.pos3.y)
					{
						//Heading to pos 1
						temp_x = ng.zone_goal.pos3.getX() - target_agent.position.getX();

						temp_y = ng.zone_goal.pos3.getY() - target_agent.position.getY();

						//get the distance between target_agent and agent(i)
						dis = Math.sqrt(Math.pow((temp_x),2) + Math.pow(temp_y,2));
					}
					//BOTTOM LEFT
					else if (target_agent.position.x < ng.zone_goal.pos1.x && target_agent.position.y > ng.zone_goal.pos4.y)
					{
						//Heading to pos 1
						temp_x = ng.zone_goal.pos4.getX() - target_agent.position.getX();

						temp_y = ng.zone_goal.pos4.getY() - target_agent.position.getY();

						//get the distance between target_agent and agent(i)
						dis = Math.sqrt(Math.pow((temp_x),2) + Math.pow(temp_y,2));
					}
					//4 SIDE CASES
					//TOP
					else if (target_agent.position.x > ng.zone_goal.pos1.x && target_agent.position.x < ng.zone_goal.pos2.x
							&& target_agent.position.y < ng.zone_goal.pos1.y)
					{
						dis = Math.abs(ng.zone_goal.pos1.y - target_agent.position.y);

					}
					//BOTTOM
					else if (target_agent.position.x > ng.zone_goal.pos1.x && target_agent.position.x < ng.zone_goal.pos2.x
							&& target_agent.position.y > ng.zone_goal.pos3.y)
					{
						dis = Math.abs(target_agent.position.y - ng.zone_goal.pos4.y);
					}
					//LEFT
					else if (target_agent.position.x < ng.zone_goal.pos1.x &&
							target_agent.position.y > ng.zone_goal.pos1.y && target_agent.position.y < ng.zone_goal.pos4.y)
					{
						dis = Math.abs(ng.zone_goal.pos4.x - target_agent.position.x );
					}
					//RIGHT
					else if (target_agent.position.x > ng.zone_goal.pos2.x &&
							target_agent.position.y > ng.zone_goal.pos1.y && target_agent.position.y < ng.zone_goal.pos4.y)
					{
						dis = Math.abs(target_agent.position.x - ng.zone_goal.pos4.x );
					}
					else
					{
						//Agent is inside the goal
						dis = 0;
					}
				}

			}


			return dis;
		}
		//Get angle
		else if(extracted_p == 2)
		{
			double angle_dif = 0;


			if (neighbor_entity instanceof Agent)
			{
				Agent ne = (Agent) neighbor_entity;

				angle_dif = Math.abs(ne.heading.value - target_agent.heading.value);

			}
			else if (neighbor_entity instanceof Obstacle)
			{
				if (neighbor_entity instanceof Obstacle_rectangle)
				{
					//Obstacle_rectangle for now does not have angle value
					return Double.NaN;
				}
				else if (neighbor_entity instanceof Obstacle_circle)
				{
					//Obstacle_circle for now does not include
					//But circle obstacle can move -> has angle value
					Obstacle_circle oc = (Obstacle_circle) neighbor_entity;
					
					angle_dif = Math.abs(oc.heading - target_agent.heading.value);
				}

			}
			else if (neighbor_entity instanceof Goal)
			{
				return Double.NaN;
			}


			
			if(angle_dif > 180)
			{
				angle_dif = 360 - angle_dif;
			}

			return angle_dif;
		}
		//Get angle to the neighbor
		else if(extracted_p == 2.1)
		{
			double angle_dif = 0;

			if (neighbor_entity instanceof Agent)
			{
				Agent ne = (Agent) neighbor_entity;

				Position temp_position = ne.position;

				if (neighbor_entity.warp == true)
				{
					temp_position = target_agent.position.getWarpPosition(target_agent.position, ne.position);
				}
				
				int angle_to_neighbor = temp_position.convertFromPositionToAngle(target_agent.position, temp_position);

				//Now, agent can use this criteria to know if other agent are in its left or right
				//if angle_dif > 0 -> neighbor agent is on the RIGHT
				//if angle_dif < 0 -> neighbor agent is on the LEFT
				angle_dif = target_agent.heading.value - angle_to_neighbor;

				//This is where FOV of agent is in UP RIGHT and part of FOV is in BOTTOM RIGHT zone
				//Where all the confusion of heading 0 or 360 are
				if (target_agent.heading.value - Main.global_var.fov_angle/2 < 0)
				{
					//need to check if the neighbor is in BOTTOM RIGHT zone
					if (angle_dif < 0 )
					{
						if (angle_to_neighbor > 360 - (Math.abs(target_agent.heading.value - Main.global_var.fov_angle/2)))
						{
							angle_dif = - angle_dif;
						}
					}

				}
				//This is where FOV of agent is in BOTTOM RIGHT and part of FOV is in UP RIGHT zone
				else if (target_agent.heading.value + Main.global_var.fov_angle/2 > 360)
				{
					//if angle_dif > 0
					//neighbor agent is on the RIGHT
					if (angle_dif > 0)
					{
						if (angle_to_neighbor < (Math.abs(Main.global_var.fov_angle/2 - (360 - target_agent.heading.value))))
						{
							angle_dif = 360 - angle_dif;
							angle_dif = - angle_dif;
						}


					}
				}		

			}
			else if (neighbor_entity instanceof Obstacle)
			{
				if (neighbor_entity instanceof Obstacle_rectangle)
				{
					/*
						Obstacle_rectangle or = (Obstacle_rectangle) neighbor_entity;

						Position or_center = new Position((or.pos1.x + or.pos2.x)/2, (or.pos1.y + or.pos4.y)/2);

						int angle_to_neighbor = temp_position.convertFromPositionToAngle(temp_position, or_center);

						//Now, agent can use this criteria to know if other agent are in its left or right
						//if angle_dif > 0 -> neighbor agent is on the RIGHT
						//if angle_dif < 0 -> neighbor agent is on the LEFT
						angle_dif = target_agent.heading.value - angle_to_neighbor;

						//This is where FOV of agent is in UP RIGHT and part of FOV is in BOTTOM RIGHT zone
						//Where all the confusion of heading 0 or 360 are
						if (target_agent.heading.value - Main.global_var.fov_angle/2 < 0)
						{
							//need to check if the neighbor is in BOTTOM RIGHT zone
							if (angle_dif < 0 )
							{
								if (angle_to_neighbor > 360 - (Math.abs(target_agent.heading.value - Main.global_var.fov_angle/2)))
								{
									angle_dif = - angle_dif;
								}
							}

						}
						//This is where FOV of agent is in BOTTOM RIGHT and part of FOV is in UP RIGHT zone
						else if (target_agent.heading.value + Main.global_var.fov_angle/2 > 360)
						{
							//if angle_dif > 0
							//neighbor agnet is on the RIGHT
							if (angle_dif > 0)
							{
								if (angle_to_neighbor < (Math.abs(Main.global_var.fov_angle/2 - (360 - target_agent.heading.value))))
								{
									angle_dif = 360 - angle_dif;
									angle_dif = - angle_dif;
								}


							}
						}	
					 */
					return Double.NaN;

				}
				else if (neighbor_entity instanceof Obstacle_circle)
				{

					//But circle obstacle can move -> has angle value
					Obstacle_circle e_c = (Obstacle_circle) neighbor_entity;

					Position temp_position = e_c.pos;

					if (neighbor_entity.warp == true)
					{
						temp_position = target_agent.position.getWarpPosition(target_agent.position, e_c.pos);
					}
					
					int angle_to_neighbor = temp_position.convertFromPositionToAngle(target_agent.position, temp_position);

					//Now, agent can use this criteria to know if other agent are in its left or right
					//if angle_dif > 0 -> neighbor agent is on the RIGHT
					//if angle_dif < 0 -> neighbor agent is on the LEFT
					angle_dif = target_agent.heading.value - angle_to_neighbor;

					//This is where FOV of agent is in UP RIGHT and part of FOV is in BOTTOM RIGHT zone
					//Where all the confusion of heading 0 or 360 are
					if (target_agent.heading.value - Main.global_var.fov_angle/2 < 0)
					{
						//need to check if the neighbor is in BOTTOM RIGHT zone
						if (angle_dif < 0 )
						{
							if (angle_to_neighbor > 360 - (Math.abs(target_agent.heading.value - Main.global_var.fov_angle/2)))
							{
								angle_dif = - angle_dif;
							}
						}

					}
					//This is where FOV of agent is in BOTTOM RIGHT and part of FOV is in UP RIGHT zone
					else if (target_agent.heading.value + Main.global_var.fov_angle/2 > 360)
					{
						//if angle_dif > 0
						//neighbor agnet is on the RIGHT
						if (angle_dif > 0)
						{
							if (angle_to_neighbor < (Math.abs(Main.global_var.fov_angle/2 - (360 - target_agent.heading.value))))
							{
								angle_dif = 360 - angle_dif;
								angle_dif = - angle_dif;
							}


						}
					}	
				}

			}
			else if (neighbor_entity instanceof Goal)
			{
				if (neighbor_entity instanceof Goal_point)
				{
					//But circle obstacle can move -> has angle value
					Goal_point g_p = (Goal_point) neighbor_entity;

					Position temp_position = g_p.position;

					if (neighbor_entity.warp == true)
					{
						temp_position = target_agent.position.getWarpPosition(target_agent.position, g_p.position);
					}
					
					int angle_to_neighbor = temp_position.convertFromPositionToAngle(target_agent.position, temp_position);

					//Now, agent can use this criteria to know if other agent are in its left or right
					//if angle_dif > 0 -> neighbor agent is on the RIGHT
					//if angle_dif < 0 -> neighbor agent is on the LEFT
					angle_dif = target_agent.heading.value - angle_to_neighbor;

					//This is where FOV of agent is in UP RIGHT and part of FOV is in BOTTOM RIGHT zone
					//Where all the confusion of heading 0 or 360 are
					if (target_agent.heading.value - Main.global_var.fov_angle/2 < 0)
					{
						//need to check if the neighbor is in BOTTOM RIGHT zone
						if (angle_dif < 0 )
						{
							if (angle_to_neighbor > 360 - (Math.abs(target_agent.heading.value - Main.global_var.fov_angle/2)))
							{
								angle_dif = - angle_dif;
							}
						}

					}
					//This is where FOV of agent is in BOTTOM RIGHT and part of FOV is in UP RIGHT zone
					else if (target_agent.heading.value + Main.global_var.fov_angle/2 > 360)
					{
						//if angle_dif > 0
						//neighbor agnet is on the RIGHT
						if (angle_dif > 0)
						{
							if (angle_to_neighbor < (Math.abs(Main.global_var.fov_angle/2 - (360 - target_agent.heading.value))))
							{
								angle_dif = 360 - angle_dif;
								angle_dif = - angle_dif;
							}


						}
					}
				}
				
			}

			
		
			while(angle_dif > 180)
			{
				angle_dif = 360 - angle_dif;
			}
			
			//System.out.println("Angle difference: " + angle_dif);
			
			//return a real distance here
			//meadning angle_dif is always positive
			
			angle_dif = Math.abs(angle_dif);
			
			return angle_dif;

		}
		//Get angle
		else if(extracted_p == 2.2)
		{
			double angle_dif = 0;

			//neighbor_entity is not warp entity
			if (neighbor_entity.warp == false)
			{
				if (neighbor_entity instanceof Agent)
				{
					Agent ne = (Agent) neighbor_entity;

					angle_dif = Math.abs(ne.heading.value-target_agent.heading.value);

				}
				else if (neighbor_entity instanceof Obstacle)
				{
					if (neighbor_entity instanceof Obstacle_rectangle)
					{
						//Obstacle_rectangle for now does not have angle value
						return Double.NaN;
					}
					else if (neighbor_entity instanceof Obstacle_circle)
					{
						//Obstacle_circle for now does not include
						//But circle obstacle can move -> has angle value
						return Double.NaN;
					}

				}
				else if (neighbor_entity instanceof Goal)
				{
					return Double.NaN;
				}

			}
			//neighbor_entity is warp entity
			else
			{

			}

			if(angle_dif > 180)
			{
				angle_dif = 360 - angle_dif;
			}

			return angle_dif;
		}
		//Speed
		else if(extracted_p == 3)
		{
			double temp_speed = 0;
			//neighbor_entity is not warp entity
			if (neighbor_entity.warp == false)
			{
				if (neighbor_entity instanceof Agent)
				{
					Agent ne = (Agent) neighbor_entity;
					temp_speed = ne.speed.value;
				}
				else if (neighbor_entity instanceof Obstacle)
				{
					if (neighbor_entity instanceof Obstacle_rectangle)
					{
						//For now, obstacle is static
						return Double.NaN;
					}
					else if (neighbor_entity instanceof Obstacle_circle)
					{
						//For now, obstacle is static
						return Double.NaN;
					}

				}
				else if (neighbor_entity instanceof Goal)
				{
					return Double.NaN;
				}

			}
			//neighbor_entity is warp entity
			else
			{

			}
			
			return temp_speed;
		}
		//Type
		else if(extracted_p == 4)
		{
			if (neighbor_entity instanceof Agent)
			{
				Agent a = (Agent) neighbor_entity;
				
				return a.type.value;
			}
			else if (neighbor_entity instanceof Obstacle)
			{
				Obstacle a = (Obstacle) neighbor_entity;
				
				return a.type.value;
				
			}
			else if (neighbor_entity instanceof Goal)
			{
				Goal g = (Goal) neighbor_entity;
				
				return g.type.value;
				
			}

			return Double.NaN;
		}
		//Zone
		else if(extracted_p == 5)
		{
			if (neighbor_entity instanceof Agent)
			{
				Agent a = (Agent) neighbor_entity;
				
				return a.zone_in.value;
			}
			else if (neighbor_entity instanceof Obstacle)
			{
				if (neighbor_entity instanceof Obstacle_rectangle)
				{
					return Double.NaN;
				}
				else if (neighbor_entity instanceof Obstacle_circle)
				{
					return Double.NaN;
				}
			}
			else if (neighbor_entity instanceof Goal)
			{
				return Double.NaN;
			}
			
			return Double.NaN;
		}
		//Access to unreserved property
		else
		{
			for (int i = 0; i < target_agent.property_set.size(); i++)
			{
				if(extracted_p == target_agent.property_set.get(i).property_ID)
				{
					return target_agent.property_set.get(i).value;
				}
			}
		}

		System.out.println("Cannot get the checking value for Activation - myUtility.java getCheckingValue");

		return Double.NaN;
	}
	
	public double getOffset(double extract_p)
	{
		
		//This agent sorely proposed is to get a reference values
		Agent a = new Agent();
		
		double offset = 0;
		
		Random rand = new Random();  ;
		
		
		//Create a random offset that will match the min and max range for each property.
		//Choose offset for angle behavior
		if(extract_p == 1 || extract_p == 2 || extract_p == 2.1)
		{

			//Get a random offset base on interval
			int interval = rand.nextInt(a.heading.interval) + 1;
			
			int positive = rand.nextInt(2);
			
			if (positive == 0)
			{
				offset = - interval * (360/a.heading.interval);
			}
			else
			{
				offset = interval * (360/a.heading.interval);
			}
		}
		//speed
		else if(extract_p == 3)
		{

			Property_numeric s = (Property_numeric) a.speed;
			
			int speed_interval = (int) (s.interval * 100);
			
			int interval = rand.nextInt(speed_interval) + 1;
			
			int positive = rand.nextInt(2);
			
			if (positive == 0)
			{
				offset = - interval * (Main.global_var.agent_speed/speed_interval);
			}
			else
			{
				offset = interval * (Main.global_var.agent_speed/speed_interval);
			}
		}
		else if(extract_p == 4 || extract_p == 4.1 || extract_p == 5)
		{
			//For now, category does not have offset
			offset = 0;
		}
		else
		{
			
		}
		
		return offset;
	}
	
	
	public ArrayList<Model> convertFromTextTo_Model_DataStructure(String rawText)
	{
		ArrayList<Model> returnModel = new ArrayList<Model>();
		
		String model_text[] = rawText.split("Generation");
		int count = 0;
				
		for (String s : model_text)
		{
			String BG_string[] = s.split("Sum is average between " + Main.global_var.simulation_per_generation + " simulations of each model");
			
			//Not care about random model.
			if (count >= 1)
			{
				ArrayList<BehaviorGroup> behavior_Group = Main.addModelFromText(BG_string[0]);
				
				//ArrayList<BehaviorGroup> preset_behavior_Group = addModelFromText(BG_string[0]);
				
				Model m = new Model(behavior_Group);
				
				
				String s1[] = BG_string[0].split(":");
				
				String fitnessScore_str[] = s1[1].split("I");
				
				double fitnessScore = Double.valueOf(fitnessScore_str[0]);
				
				m.fitnessMetric = fitnessScore;
								
				returnModel.add(m);
			}
			
			count++;
		}
		
		return returnModel;
	}
}
