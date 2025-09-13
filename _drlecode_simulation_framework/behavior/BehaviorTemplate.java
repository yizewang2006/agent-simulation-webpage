package behavior;

import java.util.ArrayList;
import java.util.Arrays;

import agents.Agent;
import core.Main;
import filters.Filter_ranged;

public class BehaviorTemplate 
{
	public String ID;
	//Will have a set of customize general parameter here
	//Each parameter can be use to restrict random behavior
	
	public double extract_property = 0;
	public int space_option;
	public int distance_option;
	public double sense_angle_option = 0;
	
	//offset here is just an option
	// -1 is negative
	// 0 is offset = 0
	// 1 is positive
	public int offset_option = 0;
	
	public BehaviorTemplate()
	{
		
		
		
	}
	
	public BehaviorTemplate(String ID, double extracted_p, int s_option, int d_option, int offset)
	{
		this.ID = ID;
		this.extract_property = extracted_p;
		this.space_option = s_option;
		//this.sense_angle_option = sense_angle;
		this.offset_option = offset;
		this.distance_option = d_option;
	}
	
	
	public ArrayList<BehaviorTemplate> getBehaviortemplate()
	{
		ArrayList<BehaviorTemplate> B_template = new ArrayList<BehaviorTemplate>();
		
		ArrayList<Double> properties = new ArrayList<Double>(Arrays.asList(1.0, 2.0, 3.0));
		
		//For evacuation scenario, we care only space behavior and speed.
		
		ArrayList<Integer> space_option = new ArrayList<Integer>(Arrays.asList(0,1,2,3));
		//-1 is sense left
		//0 is sense both
		//1 is sense right
		//ArrayList<Integer> sense_angle_filter= new ArrayList<Integer>(Arrays.asList(-1,0,1));
		
		ArrayList<Integer> offsets = new ArrayList<Integer>(Arrays.asList(-1,0,1));
		
		String ID = "";
		
		
		for (Double property_option : properties)
		{
			
			//Create template for general behavior
			for (int o: offsets)
			{
				BehaviorTemplate B_add = new BehaviorTemplate(ID, property_option, 0, 0, o);
				B_template.add(B_add);
			}
				//Create behavior template for space behavior
				
		}
		
		
		return B_template;
	}
}
