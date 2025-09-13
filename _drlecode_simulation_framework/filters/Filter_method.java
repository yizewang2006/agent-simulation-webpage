package filters;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Random;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Predicate;

import Action.Action;
import Action.NeighborReference;
import Action.SpaceReference_Expand;
import Goal.Goal;
import Goal.Goal_point;
import Goal.Goal_rectangle;
import SpaceHeadingEntity.SpaceHeadingEntity;
import Utility.GlobalVariable;
import Utility.ReturnSenseObstacle;
import Utility.myUtility;
import agents.Agent;
import agents.FieldOfView;
import agents.Position;
import agents.Property;
import core.Main;
import entities.Entity;
import obstacles.Obstacle;
import obstacles.Obstacle_circle;
import obstacles.Obstacle_rectangle;

public class Filter_method extends Filter
{
	
	public myUtility myUtility = new myUtility();
	
	public int method = 0;

	//For random filter
	public Filter_method(double filtered_p, Action act)
	{
		super(2,filtered_p);
		
		Random rand;
		
		if (Main.global_var.random_no_seed == true)
		{
			rand = new Random();  
		}
		else
		{
			rand = new Random(Main.global_var.random_seed);  
		}
		

		this.filtered_p = filtered_p;
		
		if (act instanceof NeighborReference)
		{
			//Accept only the nearest agent
			this.method = Main.searchSpace.filter_method.get(rand.nextInt(Main.searchSpace.filter_method.size()));
			
		}
		else if (act instanceof SpaceReference_Expand)
		{
			//Accept only the nearest agent
			this.method = Main.searchSpace.filter_method_space.get(rand.nextInt(Main.searchSpace.filter_method_space.size()));	
		}
		
		/*
		//Highest and smallest combination does not work on position, and angle.
		if (this.filtered_p == 1 || this.filtered_p == 2 || this.filtered_p == 2.1)
		{
			//For now, not include the random combination
			//this.method = rand.nextInt(3) + 1;

			this.method = Main.searchSpace.filter_method.get(rand.nextInt(Main.searchSpace.filter_method.size()));
			
			//For random combination
			if (this.method != 1 && this.method != 2)
			{
				this.method = 5;
			}

		}
		else if (this.filtered_p == 3)
		{
			//For now, not include the random combination
			//this.method = rand.nextInt(5) + 1;  
			this.method = rand.nextInt(4) + 1;  
		}
		else if (this.filtered_p == 4 || this.filtered_p == 5)
		{
			System.out.println ("Category type should not have method filter - Filter_method.java Filter method construction");
		}
		*/
		
		
	}

	//Constructor for Method option
	public Filter_method(double filtered_property, int method)
	{
		super(2,filtered_property);
		
		this.filtered_p = filtered_property;
		
		//Method option:
		//1: nearest -> most similar value
		//2: furthest -> most dis-similar value
		//3: highest -> highest value, use for selected property: speed, patience
		//4: smallest -> highest value, use for selected property: speed, patience
		//5: random -> select a random value
		
		this.method = method;
	}
	
	public double combination_filter_space(ArrayList<SpaceHeadingEntity> spaceHeading_entity)
	{
		double heading = 0;
		
		
		return heading;
	}
	
	public Entity combination_filter(Agent target_agent, ArrayList<Entity> neighbor_entity, int timesteps)
	{
		Entity chosen_entity = null;
		
		//1: nearest -> most similar value
		if (this.method == 1)
		{
			//Distance
			if(this.filtered_p == 1)
			{
				double nearest_distance = Double.MAX_VALUE;
				double dis = Double.MAX_VALUE;
				
				for (Entity e: neighbor_entity)
				{

					if (e instanceof Agent)
					{
						Agent ne = (Agent) e;


						Position temp_position = ne.position;

						if (e.warp == true)
						{
							temp_position = target_agent.position.getWarpPosition(target_agent.position, ne.position);
						}
						
						double temp_x = temp_position.getX() - target_agent.position.getX();

						double temp_y = temp_position.getY() - target_agent.position.getY();

						//get the distance between target_agent and agent(i)
						dis = Math.sqrt(Math.pow((temp_x),2) + Math.pow(temp_y,2));
					}
					else if (e instanceof Obstacle)
					{
						if (e instanceof Obstacle_rectangle)
						{
							//Only work for unwarp now
							ReturnSenseObstacle sense_obstacle = target_agent.fov.getRectangleObstacleDistanceWithinFOV(target_agent, target_agent.heading.value, (Obstacle_rectangle) e, timesteps);

							if (sense_obstacle != null)
							{
								dis = sense_obstacle.distance;
							}

						}
						else if (e instanceof Obstacle_circle)
						{
							Obstacle_circle o_c = (Obstacle_circle) e;

							Position temp_position = o_c.pos;

							if (e.warp == true)
							{
								temp_position = target_agent.position.getWarpPosition(target_agent.position, temp_position);
							}
							
							double temp_x = temp_position.getX() - target_agent.position.getX();

							double temp_y = temp_position.getY() - target_agent.position.getY();

							//get the distance between target_agent and agent(i)
							dis = Math.sqrt(Math.pow((temp_x),2) + Math.pow(temp_y,2));
						}
					}
					//Work with unwarp for now
					else if (e instanceof Goal)
					{
						if (e instanceof Goal_point)
						{
							Goal_point ng = (Goal_point) e;

							double temp_x = ng.position.getX() - target_agent.position.getX();

							double temp_y = ng.position.getY() - target_agent.position.getY();

							//get the distance between target_agent and agent(i)
							dis = Math.sqrt(Math.pow((temp_x),2) + Math.pow(temp_y,2));
						}
						else if (e instanceof Goal_rectangle)
						{
							//Will get the position so that the turn angle to the goal is shortest
							Goal_rectangle ng = (Goal_rectangle) e;
							double temp_x = 0;
							double temp_y = 0;

							//8 cases
							//4 CONNER CASES
							//TOP LEFT
							if (target_agent.position.x < ng.zone_goal.pos1.x && target_agent.position.y < ng.zone_goal.pos1.y)
							{
								//Heading to pos 1

								temp_x = ng.zone_goal.pos1.x - target_agent.position.getX();
								temp_y = ng.zone_goal.pos1.y - target_agent.position.getY();
							}
							//TOP RIGHT
							else if (target_agent.position.x > ng.zone_goal.pos2.x && target_agent.position.y < ng.zone_goal.pos1.y)
							{
								//Heading to pos 2
								temp_x = ng.zone_goal.pos2.x - target_agent.position.getX();
								temp_y = ng.zone_goal.pos2.y - target_agent.position.getY();
							}
							//BOTTOM RIGHT
							else if (target_agent.position.x > ng.zone_goal.pos2.x && target_agent.position.y > ng.zone_goal.pos3.y)
							{
								//Heading to pos 3
								temp_x = ng.zone_goal.pos3.x - target_agent.position.getX();
								temp_y = ng.zone_goal.pos3.y - target_agent.position.getY();
							}
							//BOTTOM LEFT
							else if (target_agent.position.x < ng.zone_goal.pos1.x && target_agent.position.y > ng.zone_goal.pos4.y)
							{
								//Heading to pos 4
								temp_x = ng.zone_goal.pos4.x - target_agent.position.getX();
								temp_y = ng.zone_goal.pos4.y - target_agent.position.getY();
							}
							//4 SIDE CASES
							//TOP
							else if (target_agent.position.x > ng.zone_goal.pos1.x && target_agent.position.x < ng.zone_goal.pos2.x
									&& target_agent.position.y < ng.zone_goal.pos1.y)
							{
								temp_x = 0;
								temp_y = ng.zone_goal.pos1.y - target_agent.position.getY();
							}
							//BOTTOM
							else if (target_agent.position.x > ng.zone_goal.pos1.x && target_agent.position.x < ng.zone_goal.pos2.x
									&& target_agent.position.y > ng.zone_goal.pos3.y)
							{
								temp_x = 0;
								temp_y = ng.zone_goal.pos3.y - target_agent.position.getY();
							}
							//LEFT
							else if (target_agent.position.x < ng.zone_goal.pos1.x &&
									target_agent.position.y > ng.zone_goal.pos1.y && target_agent.position.y < ng.zone_goal.pos4.y)
							{
								temp_x = ng.zone_goal.pos4.x - target_agent.position.getX();
								temp_y = 0;
							}
							//RIGHT
							else if (target_agent.position.x > ng.zone_goal.pos2.x &&
									target_agent.position.y > ng.zone_goal.pos1.y && target_agent.position.y < ng.zone_goal.pos4.y)
							{
								temp_x = ng.zone_goal.pos2.x - target_agent.position.getX();
								temp_y = 0;
							}
							else
							{
								//Agent is inside the goal zone
								//Distance = 0
								//Agent gaurantee is in the nearest agent
								//Not cover overlap cases
								temp_x = 0;
								temp_y = 0;
							}

							//get the distance between target_agent and agent(i)
							dis = Math.sqrt(Math.pow((temp_x),2) + Math.pow(temp_y,2));
						}

					}


					if (dis < nearest_distance)
					{
						nearest_distance = dis;
						chosen_entity = e;
					}
				}
				
			}
			//Angle
			else if (this.filtered_p == 2.0 || this.filtered_p == 2.2)
			{
				double nearest_angle = Double.MAX_VALUE;
				double angle = 0;
				
				for (Entity e: neighbor_entity)
				{
					
					if (e instanceof Agent)
					{
						Agent ne = (Agent) e;
						angle = Math.abs(target_agent.heading.value - ne.heading.value);
					}
					else if (e instanceof Obstacle)
					{
						if (e instanceof Obstacle_rectangle)
						{
							//Skip for now
						}
						else if (e instanceof Obstacle_circle)
						{
							//Skip for now
						}

					}
					
					if (angle < nearest_angle)
					{
						nearest_angle = angle;
						chosen_entity = e;
					}
				}
			}
			//Angle from heading to heading toward neighbor
			else if (this.filtered_p == 2.1)
			{
				double nearest_angle = Double.MAX_VALUE;
				double angle_dif = Double.MAX_VALUE;
				
				for (Entity e: neighbor_entity)
				{
					
					if (e instanceof Agent)
					{

						Agent ne = (Agent) e;

						Position temp_position = ne.position;

						if (e.warp == true)
						{
							temp_position = target_agent.position.getWarpPosition(target_agent.position, ne.position);
						}
						
						angle_dif = target_agent.position.convertFromPositionToAngle(target_agent.position, temp_position);

						angle_dif = Math.abs(angle_dif - target_agent.heading.value);
					}
					else if (e instanceof Obstacle)
					{
						if (e instanceof Obstacle_rectangle)
						{

						}
						else if (e instanceof Obstacle_circle)
						{

						}

					}
					
					
					if (angle_dif < nearest_angle)
					{
						nearest_angle = angle_dif;
						chosen_entity = e;
					}
				}
			}
			//Speed
			else if (this.filtered_p == 3.0)
			{
				double nearest_speed = Double.MAX_VALUE;
				double speed = Double.MAX_VALUE;
				
				for (Entity e: neighbor_entity)
				{

					if (e instanceof Agent)
					{
						Agent ne = (Agent) e;
						speed = Math.abs(target_agent.speed.value - ne.speed.value);
					}
					else if (e instanceof Obstacle)
					{
						if (e instanceof Obstacle_rectangle)
						{
							//Skip for now
						}
						else if (e instanceof Obstacle_circle)
						{
							//Skip for now
						}
					}


					if (speed < nearest_speed)
					{
						nearest_speed = speed;
						chosen_entity = e;
					}
				}
			}
			//Type
			else if (this.filtered_p == 4.0 || this.filtered_p == 5.0)
			{
				//Type should not have method filter
			}			
		}
		///////////////////////////////2: farthest -> most dis-similar value
		else if (this.method == 2)
		{
			//Distance
			if(this.filtered_p == 1)
			{
				double furthest_distance = Double.MIN_VALUE;
				double dis = Double.MIN_VALUE;
				
				for (Entity e: neighbor_entity)
				{
				
					if (e instanceof Agent)
					{
						Agent ne = (Agent) e;

						Position temp_position = ne.position;

						if (e.warp == true)
						{
							temp_position = target_agent.position.getWarpPosition(target_agent.position, ne.position);
						}

						double temp_x = temp_position.getX() - target_agent.position.getX();

						double temp_y = temp_position.getY() - target_agent.position.getY();

						//get the distance between target_agent and agent(i)
						dis = Math.sqrt(Math.pow((temp_x),2) + Math.pow(temp_y,2));
					}
					else if (e instanceof Obstacle)
					{
						if (e instanceof Obstacle_rectangle)
						{

							ReturnSenseObstacle sense_obstacle = target_agent.fov.getRectangleObstacleDistanceWithinFOV(target_agent, target_agent.heading.value,(Obstacle_rectangle) e, timesteps);

							dis = sense_obstacle.distance;
						}
						else if (e instanceof Obstacle_circle)
						{
							Obstacle_circle e_c = (Obstacle_circle) e;

							Position temp_position = e_c.pos;

							if (e.warp == true)
							{
								temp_position = target_agent.position.getWarpPosition(target_agent.position, e_c.pos);
							}

							dis = Math.sqrt(Math.pow(target_agent.position.x - temp_position.x, 2) + Math.pow(target_agent.position.y - temp_position.y, 2));

						}
					}

					if (dis > furthest_distance)
					{
						furthest_distance = dis;
						chosen_entity = e;
					}
				}
			}
			//Angle
			else if (this.filtered_p == 2.0 || this.filtered_p == 2.2)
			{
				double furthest_angle = Double.MIN_VALUE;
				double angle = Double.MIN_VALUE;
				
				for (Entity e: neighbor_entity)
				{
					if (e.warp == false)
					{
						if (e instanceof Agent)
						{
							Agent ne = (Agent) e;
							angle = Math.abs(target_agent.heading.value - ne.heading.value);
						}
						else if (e instanceof Obstacle)
						{
							if (e instanceof Obstacle_rectangle)
							{
								//Skip for now
							}
							else if (e instanceof Obstacle_circle)
							{
								//Skip for now
							}
							
						}
					}
					else
					{
						//Skip for now
					}
					
					if (angle > furthest_angle)
					{
						furthest_angle = angle;
						chosen_entity = e;
					}
				}
			}
			//Angle from heading to heading toward neighbor
			else if (this.filtered_p == 2.1)
			{
				double furthest_angle = Double.MIN_VALUE;
				double angle_dif = Double.MIN_VALUE;
				
				for (Entity e: neighbor_entity)
				{
					if (e.warp == false)
					{
						if (e instanceof Agent)
						{
							Agent ne = (Agent) e;
							
							Position temp_position = ne.position;

							if (e.warp == true)
							{
								temp_position = target_agent.position.getWarpPosition(target_agent.position, ne.position);
							}
							
							angle_dif = target_agent.position.convertFromPositionToAngle(target_agent.position, temp_position);

							angle_dif = Math.abs(angle_dif - target_agent.heading.value );
						}
						else if (e instanceof Obstacle)
						{
							if (e instanceof Obstacle_rectangle)
							{
								//Skip for now
							}
							else if (e instanceof Obstacle_circle)
							{

								Obstacle_circle e_c = (Obstacle_circle) e;
								
								Position temp_position = e_c.pos;

								if (e.warp == true)
								{
									temp_position = target_agent.position.getWarpPosition(target_agent.position, e_c.pos);
								}
								
								angle_dif = temp_position.convertFromPositionToAngle(target_agent.position, temp_position);

								angle_dif = Math.abs(angle_dif - target_agent.heading.value );
							}
							
						}
					}
					else
					{
						//Skip for now
					}
					
					if (angle_dif > furthest_angle)
					{
						furthest_angle = angle_dif;
						chosen_entity = e;
					}
				}
			}
			//Speed
			else if (this.filtered_p == 3.0)
			{
				double furthest_speed = Double.MIN_VALUE;
				double speed = Double.MIN_VALUE;
				
				for (Entity e: neighbor_entity)
				{
					if (e.warp == false)
					{
						if (e instanceof Agent)
						{
							Agent ne = (Agent) e;
							speed = Math.abs(target_agent.speed.value - ne.speed.value);
						}
						else if (e instanceof Obstacle)
						{
							if (e instanceof Obstacle_rectangle)
							{
								//Skip for now
							}
							else if (e instanceof Obstacle_circle)
							{
								//Skip for now
							}
							
						}
					}
					else
					{
						//Skip for now
					}
					
					if (speed > furthest_speed)
					{
						furthest_speed = speed;
						chosen_entity = e;
					}
				}
			}
			//Type
			else if (this.filtered_p == 4.0 || this.filtered_p == 5.0)
			{
				
			}	
		}
		//3: highest -> highest value, use for selected property: speed, patience
		else if (this.method == 3)
		{
			//Distance
			if(this.filtered_p == 1)
			{
				//Not for absolute combination
			}
			//Angle
			else if (this.filtered_p == 2.0 || this.filtered_p == 2.2)
			{
				//Not for absolute combination
			}
			//Angle from heading to heading toward neighbor
			else if (this.filtered_p == 2.1)
			{
				//Not for absolute combination
			}
			//Speed
			else if (this.filtered_p == 3.0)
			{
				double max_speed = Double.MIN_VALUE;
				double speed = Double.MIN_VALUE;
				
				for (Entity e: neighbor_entity)
				{
					if (e.warp == false)
					{
						if (e instanceof Agent)
						{
							Agent ne = (Agent) e;
							speed = ne.speed.value;
						}
						else if (e instanceof Obstacle)
						{
							if (e instanceof Obstacle_rectangle)
							{
								//Skip for now
							}
							else if (e instanceof Obstacle_circle)
							{
								//Skip for now
							}
							
						}
					}
					else
					{
						//Skip for now
					}
					
					if (speed > max_speed)
					{
						max_speed = speed;
						chosen_entity = e;
					}
				}
			}
			//Type
			else if (this.filtered_p == 4.0 || this.filtered_p == 5.0)
			{
				//Method filter should not be used for category property
			}	
		}
		//4: smallest -> highest value, use for selected property: speed, patience
		else if (this.method == 4)
		{
			//Distance
			if(this.filtered_p == 1)
			{
				//Not for absolute combination
			}
			//Angle
			else if (this.filtered_p == 2.0)
			{
				//Not for absolute combination
			}
			//Angle from heading to heading toward neighbor
			else if (this.filtered_p == 2.1 || this.filtered_p == 2.2)
			{
				//Not for absolute combination
			}
			//Speed
			else if (this.filtered_p == 3.0)
			{
				double min_speed = Double.MAX_VALUE;
				double speed = Double.MAX_VALUE;
				
				for (Entity e: neighbor_entity)
				{
					if (e.warp == false)
					{
						if (e instanceof Agent)
						{
							Agent ne = (Agent) e;
							speed = ne.speed.value;
						}
						else if (e instanceof Obstacle)
						{
							if (e instanceof Obstacle_rectangle)
							{
								//Skip for now
							}
							else if (e instanceof Obstacle_circle)
							{
								//Skip for now
							}
							
						}
					}
					else
					{
						//Skip for now
					}
					
					if (speed < min_speed)
					{
						min_speed = speed;
						chosen_entity = e;
					}
				}
			}
			//Type
			else if (this.filtered_p == 4.0 || this.filtered_p == 5.0)
			{
				//Method filter should not be used for category property
			}	
		}
		//5: random -> select a random value
		else if (this.method == 5)
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
			
			if (neighbor_entity.size() > 0)
			{
				chosen_entity = neighbor_entity.get(rand.nextInt(neighbor_entity.size()));
			}
			
		}
		
		return chosen_entity;
	}	
	
	public Filter setRandomFilterMethod()
	{
		//Need to create filter here
		ArrayList<Double> filtered_p_option = new ArrayList<Double>();
				
		for (Double d: Main.searchSpace.filter_method_property)
		{
			filtered_p_option.add(d);
		}
		
		Collections.shuffle(filtered_p_option);
		
		return new Filter_method(filtered_p_option.get(0), new NeighborReference());
	}
}