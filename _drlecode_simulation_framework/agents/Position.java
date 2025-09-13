package agents;

import java.util.ArrayList;
import java.util.Random;

import Utility.GlobalVariable;
import core.Main;
import entities.Entity;
import obstacles.Obstacle;
import obstacles.Obstacle_circle;
import zones.Zone;
import zones.Zone_rectangle;

public class Position 
{
	public double x;
	public double y;
	public boolean pub = true;
	public boolean glo = false;
	public boolean remove = false;
	public String type = "default";
	
	GlobalVariable global_var = new GlobalVariable();
	//SET
	public Position(double x, double y)
	{
		this.x = x;
		this.y = y;
	}
	

	
	public Position getPosition() 
	{
		Position position = new Position(this.x, this.y);
		
		return position; 
	}
	
	//GET
	public double getX()
	{
		return this.x;
	}
	
	public double getY()
	{
		return this.y;
	}
	
	//Later - user have a choice to set agents overlap or not.
	public void createRandomPosition()
	{
		if(global_var.agent_overlap == false)
		{
			//Not working yet
			Position pos = new Position(0,0);
        
		}
		//Agent can overlap each other.
		else
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
			
			// Generate Random doubles 
			this.x = rand.nextInt(global_var.WorldSize_width); 
			this.y = rand.nextInt(global_var.WorldSize_height); 

			//this.x = 100;
			//this.y = 100;
		}
	}
	
	public void createRandomPositionInFixZone(Zone_rectangle z, ArrayList<Entity> entity)
	{

		//In initial set up -> agents will not overlap
		//count how many times the function needs to re run to set
		// non- overlap position.
		int count = 0;

		//Position pos = new Position(0,0);

		boolean overlap = false;

		Random rand;

		if (Main.global_var.random_no_seed == true)
		{
			rand = new Random();  
		}
		else
		{
			rand = new Random(Main.global_var.random_seed);  
		}

		do 
		{
			overlap = false;
			count++;

			// Generate Random doubles 
			this.x = rand.nextInt(z.width-2) + (int)z.pos1.x; 

			this.y = rand.nextInt(z.height-2) + (int)z.pos1.y; 

			/*
				if (getDistanceBetween2Position(new Position(x,y), new Position(150,136)) >= 70)
				{
					overlap = true;
				}
				else*/
			{
				for (Entity e: entity)
				{
					if (e instanceof Agent)
					{
						Agent a = (Agent) e;

						double temp_x = this.x - a.position.x;
						double temp_y = this.y - a.position.y;

						double dis = Math.sqrt(Math.pow((temp_x),2) + Math.pow(temp_y,2));

						if (dis < Main.global_var.agent_personal_space)
						{
							overlap = true;
							break;
						}


					}
					else if (e instanceof Obstacle_circle)
					{
						Obstacle_circle o_c = (Obstacle_circle) e;
						double temp_x = this.x - o_c.pos.x;
						double temp_y = this.y - o_c.pos.y;
						double dis = Math.sqrt(Math.pow(temp_x,2) + Math.pow(temp_y,2));

						if (dis < o_c.radius + global_var.agent_personal_space + 4)
						{
							overlap = true;
							break;
						}
					}


				}
			}


			if (count > 10)
			{

				//this.x = 0; 
				//this.y = 0; 
				break;     
			}


			//System.out.println("Check: " + count);

		}
		while(overlap == true);

	}
	
	public void setHardCodePosition()
	{

		if(global_var.agent_overlap == false)
		{
			//Not working yet
			Position pos = new Position(100,100);
        
		}
		//Agent can overlap each other.
		else
		{
			this.x = 100;
			this.y = 100;
		}
	}
	
	public double getDistanceBetween2Position (Position p1, Position p2)
	{
		double distance = 0;

		double temp_x = Math.abs(p1.x - p2.x);
		double temp_y = Math.abs(p1.y - p2.y);

		distance = Math.sqrt(Math.pow(temp_x, 2) + Math.pow(temp_y, 2));

		return distance;
	}
	
	public Position setNextPositionFromAngleAndSpeed(Position current_pos, int angle, double speed)
	{
		//How many pixel an agent moves depend on the speed.
		//x = cos(angle in radian) * radius
		double next_X = Math.cos(Math.toRadians(angle)) * speed;
		
		//y = sin(angle_in_radian) * radius
		//y_axis in javaSwing is reverted
		double next_Y = Math.sin(Math.toRadians(angle)) * speed * - 1;
		
		next_X = current_pos.x + next_X;
		next_Y = current_pos.y + next_Y;
		
		//If the world warp
		if(global_var.worldWarp == true)
		{
			//Out of boundary on right side
			if(next_X > global_var.WorldSize_width)
			{
				next_X = next_X - global_var.WorldSize_width;
			}
			//Out of boundary on left side
			else if(next_X < 0)
			{
				next_X = next_X + global_var.WorldSize_width;
			}
			
			//Out of boundary on top side
			if(next_Y < 0)
			{
				next_Y = next_Y + global_var.WorldSize_height;
			}
			//Out of boundary on bottom side
			else if(next_Y > global_var.WorldSize_height)
			{
				next_Y = next_Y - global_var.WorldSize_height;
			}
			
		}
		//If the world does not warp, agent will stop after hit the boundary
		else
		{
			if(next_X > global_var.WorldSize_width)
			{
				next_X = global_var.WorldSize_width;
			}
			if(next_Y> global_var.WorldSize_height)
			{
				next_Y = global_var.WorldSize_height;
			}
		}
		
		return new Position(next_X, next_Y);
	}
	
	public int convertFromPositionToAngle(Agent target_agent, Agent observed_agent, int timesteps)
	{
		double temp_x = observed_agent.position.getX() - target_agent.position.getX();
		double temp_y = observed_agent.position.getY() - target_agent.position.getY();
		
		double compare_angle = 0;
		
		if(temp_y < 0)
		{
			//left half
			if (temp_x < 0)
			{
				//agent(i) is on UPPER - LEFT of agent_target
				compare_angle = Math.abs(Math.toDegrees(Math.atan(temp_x/temp_y))) + 90;	
			}
			//right half
			else if(temp_x > 0)
			{
				//agent(i) is on UPPER - RIGHT of agent_target
				compare_angle = Math.abs(Math.toDegrees(Math.atan(temp_y/temp_x)));
			}
			//special case temp_x = 0
			else
			{
				//Because we are currently checking UPPER half
				compare_angle = 90;
			}
				
		}
		//lower half
		else if (temp_y > 0)	
		{
			//left half
			if (temp_x < 0)
			{
				//agent(i) is on LOWER - LEFT of agent_target
				compare_angle = Math.abs(Math.toDegrees(Math.atan(temp_y/temp_x))) + 180;
			}
			//right half
			else if(temp_x > 0)
			{
				//agent(i) is on LOWER - RIGHT of agent_target
				compare_angle = Math.abs(Math.toDegrees(Math.atan(temp_x/temp_y))) + 270;
			}
			//special case temp_x = 0
			else
			{
				//Because we are currently checking LOWER half
				compare_angle = 270;
			}
		}
		//special case temp_y = 0
		else if (temp_y == 0)
		{
			//Allow overlap
			//temp_x = 0 and temp_y = 0 means that agnet(i) and agent_target are overlab
			if(temp_x >= 0)
				compare_angle = 0;
			else if (temp_x < 0)
				compare_angle = 180;
		}
		//Filter view_angle
		
		return (int) compare_angle;
	}
	
	public int convertFromPositionToAngle(Position target_agent, Position observed_agent)
	{
		double temp_x = observed_agent.getX() - target_agent.getX();
		double temp_y = observed_agent.getY() - target_agent.getY();
		
		double compare_angle = 0;
		
		if(temp_y < 0)
		{
			//left half
			if (temp_x < 0)
			{
				//agent(i) is on UPPER - LEFT of agent_target
				compare_angle = Math.abs(Math.toDegrees(Math.atan(temp_x/temp_y))) + 90;	
			}
			//right half
			else if(temp_x > 0)
			{
				//agent(i) is on UPPER - RIGHT of agent_target
				compare_angle = Math.abs(Math.toDegrees(Math.atan(temp_y/temp_x)));
			}
			//special case temp_x = 0
			else
			{
				//Because we are currently checking UPPER half
				compare_angle = 90;
			}
				
		}
		//lower half
		else if (temp_y > 0)	
		{
			//left half
			if (temp_x < 0)
			{
				//agent(i) is on LOWER - LEFT of agent_target
				compare_angle = Math.abs(Math.toDegrees(Math.atan(temp_y/temp_x))) + 180;
			}
			//right half
			else if(temp_x > 0)
			{
				//agent(i) is on LOWER - RIGHT of agent_target
				compare_angle = Math.abs(Math.toDegrees(Math.atan(temp_x/temp_y))) + 270;
			}
			//special case temp_x = 0
			else
			{
				//Because we are currently checking LOWER half
				compare_angle = 270;
			}
		}
		//special case temp_y = 0
		else if (temp_y == 0)
		{
			//Allow overlap
			//temp_x = 0 and temp_y = 0 means that agnet(i) and agent_target are overlab
			if(temp_x >= 0)
				compare_angle = 0;
			else if (temp_x < 0)
				compare_angle = 180;
		}
		//Filter view_angle
		
		return (int) compare_angle;
	}
	
	public Position getWarpPosition(Position target_agent_pos, Position chosen_agent_pos)
	{
		Position pos = new Position(0,0);
		
		if(target_agent_pos.getY() <= global_var.WorldSize_height/2  && target_agent_pos.getX() <= global_var.WorldSize_width/2)
		{						
			//chosen agent are on TOP RIGHT
			if(chosen_agent_pos.getX() >= global_var.WorldSize_width/2 && chosen_agent_pos.getY() <= global_var.WorldSize_height/2)
			{
				double warp_x = chosen_agent_pos.getX() - global_var.WorldSize_width;
				double warp_y = chosen_agent_pos.getY();
				
				pos = new Position(warp_x, warp_y);
				
			}
			//chosen agent are on BOTTOM LEFT
			else if (chosen_agent_pos.getX() <= global_var.WorldSize_width/2 && chosen_agent_pos.getY() >= global_var.WorldSize_height/2)
			{
				double warp_x = chosen_agent_pos.getX();
				double warp_y = chosen_agent_pos.getY() - global_var.WorldSize_height;
				
				pos = new Position(warp_x, warp_y);
			}
			//chosen agent are on BOTTOM RIGHT
			else if (chosen_agent_pos.getX() >= global_var.WorldSize_width/2 && chosen_agent_pos.getY() >= global_var.WorldSize_height/2)
			{
				double warp_x = chosen_agent_pos.getX() - global_var.WorldSize_width;
				double warp_y = chosen_agent_pos.getY() - global_var.WorldSize_height;
				
				pos = new Position(warp_x, warp_y);
			}
			
		}
		//TOP RIGHT x+ y-
		else if (target_agent_pos.getY() < global_var.WorldSize_height/2 && target_agent_pos.getX() > global_var.WorldSize_width/2)
		{
			//chosen agent are on TOP LEFT
			if(chosen_agent_pos.getX() <= global_var.WorldSize_width/2 && chosen_agent_pos.getY() <= global_var.WorldSize_height/2 )
			{
				double warp_x = chosen_agent_pos.getX() + global_var.WorldSize_width;
				double warp_y = chosen_agent_pos.getY();
				
				pos = new Position(warp_x, warp_y);

			}
			//chosen agent are on BOTTOM LEFT
			else if (chosen_agent_pos.getX() <= global_var.WorldSize_width/2 && chosen_agent_pos.getY() >= global_var.WorldSize_height/2)
			{
				double warp_x = chosen_agent_pos.getX() + global_var.WorldSize_width;
				double warp_y = chosen_agent_pos.getY() - global_var.WorldSize_height;
				
				pos = new Position(warp_x, warp_y);

			}
			//chosen agent are on BOTTOM RIGHT
			else if (chosen_agent_pos.getX() >= global_var.WorldSize_width/2 && chosen_agent_pos.getY() >= global_var.WorldSize_height/2)
			{
				double warp_x = chosen_agent_pos.getX();
				double warp_y = chosen_agent_pos.getY() - global_var.WorldSize_height;

				pos = new Position(warp_x, warp_y);
			}
			
		}
		//BOTTOM LEFT x- y+
		else if (target_agent_pos.getY() > global_var.WorldSize_height/2 && target_agent_pos.getX() < global_var.WorldSize_width/2)
		{
			//chosen agent are on TOP LEFT
			if(chosen_agent_pos.getX() <= global_var.WorldSize_width/2 && chosen_agent_pos.getY() <= global_var.WorldSize_height/2 )
			{
				double warp_x = chosen_agent_pos.getX();
				double warp_y = chosen_agent_pos.getY() + global_var.WorldSize_height;
				
				pos = new Position(warp_x, warp_y);
			}
			//chosen agent are on TOP RIGHT
			else if(chosen_agent_pos.getX() >= global_var.WorldSize_width/2 && chosen_agent_pos.getY() <= global_var.WorldSize_height/2)
			{
				double warp_x = chosen_agent_pos.getX() - global_var.WorldSize_width;
				double warp_y = chosen_agent_pos.getY() + global_var.WorldSize_height;

				pos = new Position(warp_x, warp_y);
			}
			//chosen agent are on BOTTOM RIGHT
			else if (chosen_agent_pos.getX() >= global_var.WorldSize_width/2 && chosen_agent_pos.getY() >= global_var.WorldSize_height/2)
			{
				double warp_x = chosen_agent_pos.getX() - global_var.WorldSize_width;
				double warp_y = chosen_agent_pos.getY();

				pos = new Position(warp_x, warp_y);
			}

		}
		//BOTTOM RIGHT x- y-
		else if (target_agent_pos.getY() > global_var.WorldSize_height/2 && target_agent_pos.getX() > global_var.WorldSize_width/2)
		{
			//chosen agent are on TOP LEFT
			if(chosen_agent_pos.getX() <= global_var.WorldSize_width/2 && chosen_agent_pos.getY() <= global_var.WorldSize_height/2 )
			{
				double warp_x = chosen_agent_pos.getX() + global_var.WorldSize_width;
				double warp_y = chosen_agent_pos.getY() + global_var.WorldSize_height;

				pos = new Position(warp_x, warp_y);

			}
			//chosen agent are on TOP RIGHT
			else if (chosen_agent_pos.getX() >= global_var.WorldSize_width/2 && chosen_agent_pos.getY() <= global_var.WorldSize_height/2)
			{
				double warp_x = chosen_agent_pos.getX();
				double warp_y = chosen_agent_pos.getY() + global_var.WorldSize_height;
				
				pos = new Position(warp_x, warp_y);
			}
			//chosen agent are on BOTTOM LEFT
			else if (chosen_agent_pos.getX() <= global_var.WorldSize_width/2 && chosen_agent_pos.getY() >= global_var.WorldSize_height/2)
			{
				double warp_x = chosen_agent_pos.getX() + global_var.WorldSize_width;
				double warp_y = chosen_agent_pos.getY();
				
				pos = new Position(warp_x, warp_y);

			}
		}
		
		return pos;
	}
}
