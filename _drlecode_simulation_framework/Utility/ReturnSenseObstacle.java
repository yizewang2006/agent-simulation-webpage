package Utility;

import java.util.ArrayList;

import agents.Position;
import obstacles.Obstacle;
import zones.Zone;


public class ReturnSenseObstacle 
{
	public String edge = null;
	public Obstacle obstacle;
	public ArrayList<Position> sense_edge = new ArrayList<Position>();
	public double distance = 0;
	public Position sense_corner = null;
	
	public ReturnSenseObstacle(Obstacle obstacle, Position pos1, Position pos2, double d, String s)
	{
		this.obstacle = obstacle;
		this.sense_edge.add(pos1);
		this.sense_edge.add(pos2);
		
		this.distance = d;
		this.edge = s;
	}
	
	//To handle the case where agent is in one of the 4 corner zones of the rectangle obstacle or zone
	public ReturnSenseObstacle(Obstacle obstacle, Position pos1, Position pos2, Position s_conner, double d, String s)
	{
		this.obstacle = obstacle;
		
		sense_corner = s_conner;
		
		this.sense_edge.add(pos1);
		this.sense_edge.add(pos2);
		
		this.distance = d;
		
		this.edge = s;
	}
}
