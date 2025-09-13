package obstacles;

import java.util.ArrayList;

import agents.Agent;
import agents.Position;
import core.Main;
import entities.Entity;

public class Obstacle_rectangle extends Obstacle
{
	/*
	 pos1 -------- pos2
	 |				  |	
	 |				  |
	 |				  |
	 |				  |
	 pos4 -------- pos3	
	  
	 */
	public Position pos1;
	public Position pos2;
	public Position pos3;
	public Position pos4;
	public ArrayList<Edge> edge_l= new ArrayList<Edge>();
	
	public int width;
	public int height;
	public int radius;
	public String shape_type;
	public double speed;
	
	public Obstacle_rectangle()
	{
		super(new Position(0,0),2.0);
	}
	//Rectangle obstacle
	//Rectangle obstacle
	public Obstacle_rectangle(Position p, int w, int h, double type)
	{
		super(p,type);
		this.shape_type = "rectangle";
		this.pos1 = p;
		this.width = w;
		this.height = h;
		this.type.value = type;

		this.pos2 = new Position(pos1.x + w, pos1.y);
		this.pos3 = new Position(pos1.x + w, pos1.y + h);
		this.pos4 = new Position(pos1.x, pos1.y + h);
		
		edge_l.add(new Edge(pos1, pos2, "top"));
		edge_l.add(new Edge(pos2, pos3, "left"));
		edge_l.add(new Edge(pos3, pos4, "bottom"));
		edge_l.add(new Edge(pos4, pos1, "left"));
		
	}

	//Deep copy a obstacle rectangle
	public Obstacle_rectangle(Obstacle_rectangle or)
	{
		super(or.pos1,or.type.value);
		this.shape_type = "rectangle";
		this.pos1 = or.pos1;
		this.width = or.width;
		this.height = or.height;
		this.type.value = or.type.value;

		this.pos2 = new Position(pos1.x + or.width, pos1.y);
		this.pos3 = new Position(pos1.x + or.width, pos1.y + or.height);
		this.pos4 = new Position(pos1.x, pos1.y + or.height);
		
		edge_l.add(new Edge(pos1, pos2, "top"));
		edge_l.add(new Edge(pos2, pos3, "left"));
		edge_l.add(new Edge(pos3, pos4, "bottom"));
		edge_l.add(new Edge(pos4, pos1, "left"));
		
	}
	//For rectangle type
	//For now, only works for rectangle or square
	public double upperB()
	{
		double upperB = 0;

		if (pos1.y == pos2.y)
		{
			upperB = pos1.y;
		}

		return upperB;
	}

	public double lowerB()
	{
		double lowerB = 0;

		if (pos3.y == pos4.y)
		{
			lowerB = pos3.y;
		}
		return lowerB;
	}

	public double rightB()
	{
		double rightB = 0;

		if (pos2.x == pos3.x)
		{
			rightB = pos2.x;
		}
		return rightB;
	}

	public double leftB()
	{
		double leftB = 0;

		if (pos4.x == pos1.x)
		{
			leftB = pos4.x;
		}
		return leftB;
	}
	
	public ArrayList<Position> getIntersection_FOV_Edge_and_RectangleObs(Agent target_agent, Obstacle_rectangle ob_rec, double FOV_distance)
	{
		ArrayList<Position> return_pos = new ArrayList<Position>();
		
		Obstacle_rectangle or = (Obstacle_rectangle) ob_rec;
		
		ArrayList<Edge> edge_list = new ArrayList<Edge>();
		
		edge_list.add(new Edge(or.pos1, or.pos2, "top"));
		edge_list.add(new Edge(or.pos2, or.pos3, "left"));
		edge_list.add(new Edge(or.pos3, or.pos4, "bottom"));
		edge_list.add(new Edge(or.pos4, or.pos1, "left"));
		
		for (Edge e : edge_list)
		{	
			double theta = 0;
			
			for (int i = 0; i < 2; i++)
			{
				if (i == 0)
				{
					//Checking the the right FOV first
					theta = target_agent.heading.value - target_agent.fov.view_angle/2;
					
				}
				else
				{
					//Checking the the left FOV later
					theta = target_agent.heading.value + target_agent.fov.view_angle/2;
				}
				
				if (theta < 0)
				{
					theta = 360 + theta;
				}
				
				if (theta > 360)
				{
					theta = theta - 360;
				}
				
				theta = theta*Math.PI/180;
				
				//Change position coordination so that (0,0) is bottom left
				int world_height = Main.global_var.WorldSize_height;
				//Only need to change y position
				e.A.y = world_height - e.A.y;
				e.B.y = world_height - e.B.y;
				target_agent.position.y = world_height - target_agent.position.y;
				
				double R = FOV_distance;
				
				double d = (e.A.y - e.B.y) * R * Math.cos(theta) - (e.A.x - e.B.x) * R * Math.sin(theta);
				double d1 = (e.A.x - target_agent.position.x) * (e.A.y-e.B.y) - (e.A.x - e.B.x) * (e.A.y - target_agent.position.y);
				double d2 = (e.A.y - target_agent.position.y) * R * Math.cos(theta) - (e.A.x - target_agent.position.x) * R * Math.sin(theta);
				
				//There is one intersection
				if (d != 0)
				{
					double s = d2 / d;
					
					//Intersection is between edge AB
					if (0 <= s && s <= 1)
					{
						double x = e.A.x + (e.B.x - e.A.x) * s;
						double y = e.A.y + (e.B.y - e.A.y) * s;
						
						Position intersection = new Position(x,y);
						
						intersection.y = world_height - intersection.y;
						target_agent.position.y = world_height - target_agent.position.y;
						
						if (PositionWithinAFOV(target_agent, intersection, FOV_distance) == true)
						{
							return_pos.add(intersection);
						}
						target_agent.position.y = world_height - target_agent.position.y;
					}
					
					double t = d1 / d;
							
					//Intersection is on FOV side
					if (0 <= t && t <= 1)
					{
						
						double x = target_agent.position.x + R*Math.cos(theta)*t;
						double y = target_agent.position.y + R*Math.sin(theta)*t;
						
						Position intersection = new Position(x,y);
						intersection.y = world_height - intersection.y;
						target_agent.position.y = world_height - target_agent.position.y;
						if (PositionWithinAFOV(target_agent, intersection, FOV_distance) == true)
						{
							//return_pos.add(intersection);
						}
						target_agent.position.y = world_height - target_agent.position.y;
					}
					
				}
				//Special case
				else
				{
					//AB edge is on FOV line
					if (d1 == 0)
					{
						if (PositionWithinAFOV(target_agent, new Position(e.A.x, e.A.y), FOV_distance) == true)
						{
							return_pos.add(new Position(e.A.x, e.A.y));
						}
						
						if (PositionWithinAFOV(target_agent, new Position(e.B.x, e.B.y), FOV_distance) == true)
						{
							return_pos.add(new Position(e.B.x, e.B.y));
						}
						
						//return_pos.add(new Position(e.A.x, e.A.y));
						//return_pos.add(new Position(e.B.x, e.B.y));
					}
					//AB is parallel with FOV line
					//No intersection
					else
					{
						
					}
				}
				
				//Change to position coordination back to (0,0) is on top left
				//Only need to change y position
				e.A.y = world_height - e.A.y;
				e.B.y = world_height - e.B.y;
				target_agent.position.y = world_height - target_agent.position.y;
			}
			
			
		}
			
		
		return return_pos;
	}
	public ArrayList<Position> getIntersection_FOV_Arc_and_RectangleObs(Agent target_agent, Obstacle_rectangle ob_rec, double FOV_distance)
	{
		
		ArrayList<Position> return_pos = new ArrayList<Position>();
		
		Obstacle_rectangle or = (Obstacle_rectangle) ob_rec;
		//FOV variable

		//Need to check intersection with 4 edge of the rectangle
		ArrayList<Edge> edge_list = new ArrayList<Edge>();
		
		edge_list.add(new Edge(or.pos1, or.pos2, "top"));
		edge_list.add(new Edge(or.pos2, or.pos3, "left"));
		edge_list.add(new Edge(or.pos3, or.pos4, "bottom"));
		edge_list.add(new Edge(or.pos4, or.pos1, "left"));
		
		for (Edge e : edge_list)
		{
			double m = Math.pow(e.B.x - e.A.x, 2) + Math.pow(e.B.y - e.A.y, 2);
			double n = (e.A.x - target_agent.position.x)*(e.B.x - e.A.x) + (e.A.y - target_agent.position.y)*(e.B.y - e.A.y);
			double p = Math.pow(e.A.x - target_agent.position.x, 2) + Math.pow(e.A.y - target_agent.position.y, 2) - Math.pow(FOV_distance, 2);
		
			double result = Math.pow(n, 2) - m * p;

			
			//No intersection
			if (result < 0)
			{
				
			}
			//AB is tangent to the arc
			else if (result == 0)
			{
				double s = -n/m;
				
				//Mean that the intersection is between A and B
				if (0 <= s && s <= 1)
				{
					
					Position intersection = getIntersectionBetweenEdgeAB(e,s);
					if (PositionWithinAFOV(target_agent, intersection, FOV_distance) == true)
					{
						return_pos.add(intersection);
					}
					
				}
				
				//Intersection is on AB line, but not between AB
				{
					
					Position intersection = getIntersectionBetweenFOVArc(target_agent, e, s, FOV_distance);
					if (intersection != null)
					{
						if (PositionWithinAFOV(target_agent, intersection, FOV_distance) == true)
						{
							//return_pos.add(intersection);
						}
					}
						
				}
			}
			//AB has two intersections with the arc
			else
			{
				double s1 = (-n + Math.sqrt(n*n - m*p))/m;
				double s2 = (-n - Math.sqrt(n*n - m*p))/m;
				
				//Mean that the intersection is between A and B
				if (0 <= s1 && s1 <= 1)
				{
					Position intersection = getIntersectionBetweenEdgeAB(e,s1);
					if (PositionWithinAFOV(target_agent, intersection, FOV_distance) == true)
					{
						return_pos.add(intersection);
					}
				}
				
				//Intersection is on AB line, but not between AB
				{
					Position intersection = getIntersectionBetweenFOVArc(target_agent, e, s1, FOV_distance);
					if (intersection != null)
					{
						if (PositionWithinAFOV(target_agent, intersection, FOV_distance) == true)
						{
							//return_pos.add(intersection);
						}
					}
				}
				
				//Mean that the intersection is between A and B
				if (0 <= s2 && s2 <= 1)
				{
					Position intersection = getIntersectionBetweenEdgeAB(e,s2);
					if (PositionWithinAFOV(target_agent, intersection, FOV_distance) == true)
					{
						return_pos.add(intersection);
					}
				}
				
				//Intersection is on AB line, but not between AB
				{
					Position intersection = getIntersectionBetweenFOVArc(target_agent, e, s2, FOV_distance);
					if (intersection != null)
					{
						if (PositionWithinAFOV(target_agent, intersection, FOV_distance) == true)
						{
							//return_pos.add(intersection);
						}
					}
				}
			}
			
		}
		
		//If a corner is inside FOV -> add it too
		
		return return_pos;
	}
	
	
	
	public Position getIntersectionBetweenEdgeAB(Edge e, double s)
	{
		double x = e.A.x + (e.B.x - e.A.x) * s;
		double y = e.A.y + (e.B.y - e.A.y) * s;
		
		return new Position(x,y);
	}
	
	public Position getIntersectionBetweenFOVArc(Agent target_agent, Edge e, double s, double FOV_distance)
	{
		double cost = (e.A.x - target_agent.position.x + (e.B.x - e.A.x) * s)/FOV_distance;
		double sint = (e.A.y - target_agent.position.y + (e.B.y - e.A.y) * s)/FOV_distance;
		
		double t = Math.acos(cost);
		
		double theta = target_agent.heading.value - target_agent.fov.view_angle/2;
		
		if (theta < 0)
		{
			theta = 360 + theta;
		}
		
		//Intersection is on the arc
		//Check both cases where FOV side are on quadrant 1 and 4 and else
		if (t <= theta && t <= theta + target_agent.fov.view_angle
			|| 
			(t + 360) <= target_agent.heading.value && (t + 360) <= target_agent.heading.value + target_agent.fov.view_angle)
		{
			double x = target_agent.position.x + FOV_distance * cost;
			double y = target_agent.position.y + FOV_distance * sint;
			
			return new Position(x,y);
		}
		else
		{
			return null;
		}
	}
	
	public Boolean PositionWithinAFOV(Agent target_agent, Position pos, double FOV_distance)
	{
		
		int range_right = (int) (target_agent.heading.value - Main.global_var.fov_angle/2);;
		int range_left = (int) (target_agent.heading.value + Main.global_var.fov_angle/2);;


		//range_right = (int) (target_agent.heading.value - view_angle/2);
		//range_left = (int) (target_agent.heading.value + view_angle/2);

		//No need to compare target_agent with itself


		// temp_x = (x_target - x_i) 
		double temp_x = pos.getX() - target_agent.position.getX();

		// temp_y = (y_target - y_i)
		double temp_y = pos.getY() - target_agent.position.getY();



		//get the distance between target_agent and agent(i)
		double dis = Math.sqrt(Math.pow((temp_x),2) + Math.pow(temp_y,2)) - Main.global_var.agent_radius;

		//Filter view_distance first
		//Find all agents within the view_distance of target agents
		if(dis < FOV_distance)
		{
			double compare_angle = 0;

			//System.out.println("Agents:" + i + " in a neighbor");

			//All the position of agent(i) and target_agent is compared base on origin (0,0),
			//In this case is top left of panel
			//upper half
			if(temp_y < 0)
			{
				//left half
				if (temp_x < 0)
				{
					//agent(i) is on UPPER - LEFT of agent_target
					compare_angle = Math.abs(Math.toDegrees(Math.atan(temp_x/temp_y))) + 90;

					if (target_agent.fov.insideFOV(compare_angle, range_right, range_left) == true)
					{
						return true;
					}
					else
					{
						return false;
					}

				}
				//right half
				else if(temp_x > 0)
				{
					//agent(i) is on UPPER - RIGHT of agent_target
					compare_angle = Math.abs(Math.toDegrees(Math.atan(temp_y/temp_x)));

					if (target_agent.fov.insideFOV(compare_angle, range_right, range_left) == true)
					{
						//Agent(i) is within view_angle of target agent
						return true;
					}
					else
					{
						return false;
					}

				}
				//special case temp_x = 0
				else
				{
					//Because we are currently checking UPPER half
					compare_angle = 90;
					if (target_agent.fov.insideFOV(compare_angle, range_right, range_left) == true)
					{
						//Agent(i) is within view_angle of target agent
						return true;
					}
					else
					{
						return false;
					}

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

					if (target_agent.fov.insideFOV(compare_angle, range_right, range_left) == true)
					{
						//Agent(i) is within view_angle of target agent
						return true;
					}
					else
					{
						return false;
					}

				}
				//right half
				else if(temp_x > 0)
				{
					//agent(i) is on LOWER - RIGHT of agent_target
					compare_angle = Math.abs(Math.toDegrees(Math.atan(temp_x/temp_y))) + 270;

					if (target_agent.fov.insideFOV(compare_angle, range_right, range_left) == true)
					{
						//Agent(i) is within view_angle of target agent
						return true;
					}
					else
					{
						return false;
					}

				}
				//special case temp_x = 0
				else
				{
					//Because we are currently checking LOWER half
					compare_angle = 270;
					if (target_agent.fov.insideFOV(compare_angle, range_right, range_left) == true)
					{
						//Agent(i) is within view_angle of target agent
						return true;
					}
					else
					{
						return false;
					}

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

				if (target_agent.fov.insideFOV(compare_angle, range_right, range_left) == true)
				{
					//Agent(i) is within view_angle of target agent
					return true;
				}
				else
				{
					return false;
				}

			}
			//Filter view_angle
		}

		return false;
	}

}

class Edge
{
	//2 point of the edge
	Position A;
	Position B;
	String type = "default";
	
	public Edge (Position p1, Position p2, String t)
	{
		A = p1;
		B = p2;
		type = t;
	}
}
