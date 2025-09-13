package agents;

import java.util.Random;

import zones.Zone;

public class agentGenerator 
{
	public Zone generate_zone;
	public Position position;
	public int rate;
	public int starting_heading;
	public double starting_speed;
	public double staring_type;
	private double base_x;
	private double base_y;
	
	public agentGenerator(Position p, int h, double s, double t, int r)
	{
		this.position = p;
		this.base_x = p.x;
		this.base_y = p.y;
		this.starting_heading = h;
		this.starting_speed = s;
		this.staring_type = t;
		this.rate = r;
	}
	
	public void fixYPosition(int y)
	{
		this.position.y = y;
	}
	
	public void randomYPosition()
	{
		Random rand = new Random();
		
		//this.position.y = this.base_y + rand.nextInt(0);
	}
	
	public void randomYPosition(int min, int max)
	{
		
		Random r = new Random();
		
		this.position.y = r.nextInt(max - min) + min;

		//this.position.y = 80;
	}
	
}
