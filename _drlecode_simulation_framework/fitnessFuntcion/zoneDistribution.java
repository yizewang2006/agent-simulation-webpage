package fitnessFuntcion;

import java.util.ArrayList;

import Utility.GlobalVariable;
import agents.Agent;
import agents.Position;
import zones.Zone;
import zones.Zone_rectangle;

public class zoneDistribution 
{
	int fitnessScore = 0;
	
	ArrayList<Agent> agents;
	ArrayList<Zone> zones ;
	
	public GlobalVariable global_var = new GlobalVariable();

	public zoneDistribution(ArrayList<Agent> agents,ArrayList<Zone> zones)
	{
		this.agents = agents;
		this.zones = zones;
	}
	
	//Count how many agents are distributed during the whole simulation
	//Only work if zone is specify correctly
	public int fitnessScore(int timesteps)
	{	
		int ave = agents.size() / zones.size();
		
		for (Zone z : zones)
		{

			if (z instanceof Zone_rectangle)
			{
				Zone_rectangle z_rec = (Zone_rectangle) z;
				int count_a_in_zone = 0;
				
				for (Agent a : agents)
				{
					Position p;

					p = a.position;
					
						
					if (ave < 1)
					{
						ave = 1;
					}
					
					
					
					if (p.x >= z_rec.leftB() && p.x <= z_rec.rightB() && p.y >= z_rec.upperB() && p.y <= z_rec.lowerB())
					{
						count_a_in_zone++;
					}
				}
				
				fitnessScore += Math.abs(count_a_in_zone - ave);
			}
			}
			
			
			
		
		return this.fitnessScore;
	}
}
